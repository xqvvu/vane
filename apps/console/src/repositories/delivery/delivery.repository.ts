import { encodeJson, redactText } from "@vane/core";
import type { DeliveryAttempt, DeliveryDetail, DeliveryJob } from "@vane/core";

import { rowAs, rowOrUndefined, rowsAs } from "#/infra/sqlite/codecs.ts";
import type { SqliteRepositoryContext } from "#/infra/sqlite/context.ts";
import {
  attemptFromRow,
  decodeRenderedPayload,
  deliveryFromRow,
  pruneDedupeKeys,
  redactNullableText,
  requireAttempt,
  requireDelivery,
  reserveDedupeKey,
} from "#/repositories/delivery/delivery.helpers.ts";
import type {
  ClaimDeliveriesInput,
  ClaimedDelivery,
  DeliveryAttemptRow,
  DeliveryRepository,
  DeliveryRow,
  EnqueueDeliveriesInput,
  EnqueueDeliveriesResult,
  DedupedDelivery,
  MarkDeliveryFailedInput,
  MarkDeliverySucceededInput,
  ReclaimStaleRunningDeliveriesInput,
  ReclaimStaleRunningDeliveriesResult,
  RetryDeliveryInput,
} from "#/repositories/delivery/delivery.interface.ts";
import { InvalidDeliveryStateError } from "#/repositories/delivery/delivery.interface.ts";
import {
  destinationMetadataFromRuntime,
  destinationSummaryFromRuntime,
  requireDestination,
} from "#/repositories/destination/destination.helpers.ts";
import type { DestinationRepository } from "#/repositories/destination/destination.interface.ts";
import { requireEvent } from "#/repositories/intake/intake.helpers.ts";
import type { SqliteIntakeRepository } from "#/repositories/intake/intake.repository.ts";
import type { RouteRepository } from "#/repositories/route/route.interface.ts";
import { requireSource, sourceSummaryFromRuntime } from "#/repositories/source/source.helpers.ts";
import type { SourceRepository } from "#/repositories/source/source.interface.ts";
export class SqliteDeliveryRepository implements DeliveryRepository {
  constructor(
    private readonly context: SqliteRepositoryContext,
    private readonly sources: SourceRepository,
    private readonly destinations: DestinationRepository,
    private readonly routes: RouteRepository,
    private readonly intake: SqliteIntakeRepository,
  ) {}

  enqueueForEvent(input: EnqueueDeliveriesInput): EnqueueDeliveriesResult {
    return this.context.runInTransaction(() => {
      const created: DeliveryJob[] = [];
      const deduped: DedupedDelivery[] = [];
      const now = input.now ?? this.context.now();
      const maxAttempts = input.maxAttempts ?? 3;

      pruneDedupeKeys(this.context.db, input.dedupeWindowStartsAt);

      for (const match of input.matches) {
        for (const destinationId of match.destinationIds) {
          if (input.event.idempotencyKey) {
            const dedupe = reserveDedupeKey(this.context.db, {
              source_id: input.event.sourceId,
              idempotency_key: input.event.idempotencyKey,
              route_id: match.routeId,
              destination_id: destinationId,
              first_event_id: input.event.id,
              created_at: now,
            });

            if (dedupe !== null) {
              deduped.push({
                sourceId: dedupe.source_id,
                idempotencyKey: dedupe.idempotency_key,
                routeId: dedupe.route_id,
                destinationId: dedupe.destination_id,
                firstEventId: dedupe.first_event_id,
              });
              continue;
            }
          }

          const id = this.context.ids.delivery();
          this.context.db
            .prepare(
              `
                INSERT INTO deliveries (
                  id,
                  event_id,
                  destination_id,
                  route_id,
                  state,
                  attempt_count,
                  max_attempts,
                  next_attempt_at,
                  last_error,
                  rendered_payload_json,
                  created_at,
                  updated_at,
                  finished_at
                )
                VALUES (?, ?, ?, ?, 'pending', 0, ?, NULL, NULL, NULL, ?, ?, NULL)
              `,
            )
            .run(id, input.event.id, destinationId, match.routeId, maxAttempts, now, now);

          created.push(requireDelivery(this.getJob(id)));
        }
      }

      return { created, deduped };
    });
  }

  reclaimStaleRunning(
    input: ReclaimStaleRunningDeliveriesInput,
  ): ReclaimStaleRunningDeliveriesResult {
    return this.context.runInTransaction(() => {
      const now = input.now ?? this.context.now();
      const error = input.error ?? "Delivery attempt timed out before completion";
      const rows = rowsAs<DeliveryRow & { attempt_id: string }>(
        this.context.db
          .prepare(
            `
              SELECT deliveries.*, delivery_attempts.id AS attempt_id
              FROM deliveries
              JOIN delivery_attempts ON delivery_attempts.delivery_id = deliveries.id
              WHERE deliveries.state = 'running'
                AND delivery_attempts.state = 'running'
                AND delivery_attempts.started_at <= ?
              ORDER BY delivery_attempts.started_at
            `,
          )
          .all(input.staleBefore),
      );
      let reclaimed = 0;

      for (const row of rows) {
        const current = requireDelivery(this.getJob(row.id));

        if (current.state !== "running") {
          continue;
        }

        this.markFailed({
          deliveryId: row.id,
          attemptId: row.attempt_id,
          error,
          retryAt: current.attemptCount < current.maxAttempts ? now : null,
          finishedAt: now,
        });
        reclaimed += 1;
      }

      return { reclaimed };
    });
  }

  claimNext(input: ClaimDeliveriesInput): ClaimedDelivery[] {
    return this.context.runInTransaction(() => {
      const now = input.now ?? this.context.now();
      const rows = rowsAs<DeliveryRow>(
        this.context.db
          .prepare(
            `
              SELECT deliveries.*
              FROM deliveries
              JOIN destinations ON destinations.id = deliveries.destination_id
              LEFT JOIN routes ON routes.id = deliveries.route_id
              WHERE deliveries.state = 'pending'
                AND destinations.enabled = 1
                AND (deliveries.route_id IS NULL OR routes.enabled = 1)
                AND (deliveries.next_attempt_at IS NULL OR deliveries.next_attempt_at <= ?)
                AND deliveries.attempt_count < deliveries.max_attempts
              ORDER BY COALESCE(deliveries.next_attempt_at, deliveries.created_at), deliveries.created_at
              LIMIT ?
            `,
          )
          .all(now, input.limit),
      );
      const claimed: ClaimedDelivery[] = [];

      for (const row of rows) {
        const attemptNumber = row.attempt_count + 1;
        const attemptId = this.context.ids.attempt();

        this.context.db
          .prepare(
            `
              UPDATE deliveries
              SET state = 'running', attempt_count = ?, updated_at = ?
              WHERE id = ? AND state = 'pending'
          `,
          )
          .run(attemptNumber, now, row.id);

        const updateResult = this.context.db.prepare("SELECT changes() AS changes").get() as {
          changes: number;
        };

        if (updateResult.changes > 0) {
          this.context.db
            .prepare(
              `
                INSERT INTO delivery_attempts (
                  id,
                  delivery_id,
                  attempt_number,
                  state,
                  response_status,
                  response_body,
                  error,
                  started_at,
                  finished_at
                )
                VALUES (?, ?, ?, 'running', NULL, NULL, NULL, ?, NULL)
              `,
            )
            .run(attemptId, row.id, attemptNumber, now);
        }

        const job = requireDelivery(this.getJob(row.id));
        const event = requireEvent(this.intake.get(job.eventId));
        const source = requireSource(this.sources.get(event.sourceId));
        const destination = requireDestination(this.destinations.get(job.destinationId));
        const route = job.routeId ? this.routes.get(job.routeId) : null;
        const attempt = requireAttempt(this.getAttempt(attemptId));

        claimed.push({ job, attempt, event, source, destination, route });
      }

      return claimed;
    });
  }

  markSucceeded(input: MarkDeliverySucceededInput): DeliveryJob {
    return this.context.runInTransaction(() => {
      const finishedAt = input.finishedAt ?? this.context.now();

      this.context.db
        .prepare(
          `
            UPDATE delivery_attempts
            SET state = 'succeeded', response_status = ?, response_body = ?, error = NULL, finished_at = ?
            WHERE id = ? AND delivery_id = ?
          `,
        )
        .run(
          input.responseStatus ?? null,
          redactNullableText(input.responseBody),
          finishedAt,
          input.attemptId,
          input.deliveryId,
        );

      this.context.db
        .prepare(
          `
            UPDATE deliveries
            SET state = 'succeeded',
                next_attempt_at = NULL,
                last_error = NULL,
                rendered_payload_json = COALESCE(?, rendered_payload_json),
                updated_at = ?,
                finished_at = ?
            WHERE id = ?
          `,
        )
        .run(
          input.renderedPayload === undefined ? null : encodeJson(input.renderedPayload),
          finishedAt,
          finishedAt,
          input.deliveryId,
        );

      return requireDelivery(this.getJob(input.deliveryId));
    });
  }

  markFailed(input: MarkDeliveryFailedInput): DeliveryJob {
    return this.context.runInTransaction(() => {
      const finishedAt = input.finishedAt ?? this.context.now();
      const current = requireDelivery(this.getJob(input.deliveryId));
      const shouldRetry = input.retryAt !== null && current.attemptCount < current.maxAttempts;
      const nextState = shouldRetry ? "pending" : "failed";
      const nextAttemptAt = shouldRetry ? input.retryAt : null;
      const finishedDeliveryAt = shouldRetry ? null : finishedAt;

      this.context.db
        .prepare(
          `
            UPDATE delivery_attempts
            SET state = 'failed', response_status = ?, response_body = ?, error = ?, finished_at = ?
            WHERE id = ? AND delivery_id = ?
          `,
        )
        .run(
          input.responseStatus ?? null,
          redactNullableText(input.responseBody),
          redactText(input.error),
          finishedAt,
          input.attemptId,
          input.deliveryId,
        );

      this.context.db
        .prepare(
          `
            UPDATE deliveries
            SET state = ?, next_attempt_at = ?, last_error = ?, updated_at = ?, finished_at = ?
            WHERE id = ?
          `,
        )
        .run(
          nextState,
          nextAttemptAt,
          redactText(input.error),
          finishedAt,
          finishedDeliveryAt,
          input.deliveryId,
        );

      return requireDelivery(this.getJob(input.deliveryId));
    });
  }

  retryNow(input: RetryDeliveryInput): DeliveryJob {
    return this.context.runInTransaction(() => {
      const requestedAt = input.requestedAt ?? this.context.now();
      const current = requireDelivery(this.getJob(input.deliveryId));

      if (current.state !== "failed") {
        throw new InvalidDeliveryStateError(input.deliveryId, current.state, "retry");
      }

      this.context.db
        .prepare(
          `
            UPDATE deliveries
            SET state = 'pending',
                max_attempts = CASE
                  WHEN max_attempts <= attempt_count THEN attempt_count + 1
                  ELSE max_attempts
                END,
                next_attempt_at = ?,
                last_error = NULL,
                updated_at = ?,
                finished_at = NULL
            WHERE id = ?
          `,
        )
        .run(requestedAt, requestedAt, input.deliveryId);

      return requireDelivery(this.getJob(input.deliveryId));
    });
  }

  get(id: string): DeliveryDetail | null {
    const job = this.getJob(id);

    if (!job) {
      return null;
    }

    const event = requireEvent(this.intake.get(job.eventId));
    const source = sourceSummaryFromRuntime(requireSource(this.sources.get(event.sourceId)));
    const destinationRuntime = requireDestination(this.destinations.get(job.destinationId));
    const destination = destinationSummaryFromRuntime(destinationRuntime);
    const destinationMetadata = destinationMetadataFromRuntime(destinationRuntime);
    const route = job.routeId ? this.routes.get(job.routeId) : null;
    const attempts = this.context.db
      .prepare("SELECT * FROM delivery_attempts WHERE delivery_id = ? ORDER BY attempt_number")
      .all(job.id)
      .map((row) => attemptFromRow(rowAs<DeliveryAttemptRow>(row)));
    const row = rowOrUndefined<Pick<DeliveryRow, "rendered_payload_json">>(
      this.context.db.prepare("SELECT rendered_payload_json FROM deliveries WHERE id = ?").get(id),
    );

    return {
      job,
      event,
      source,
      destination,
      destinationMetadata,
      route,
      renderedPayload: row ? decodeRenderedPayload(row.rendered_payload_json) : null,
      attempts,
    };
  }

  getJob(id: string): DeliveryJob | null {
    const row = rowOrUndefined<DeliveryRow>(
      this.context.db.prepare("SELECT * FROM deliveries WHERE id = ?").get(id),
    );
    return row ? deliveryFromRow(row) : null;
  }

  getAttempt(id: string): DeliveryAttempt | null {
    const row = rowOrUndefined<DeliveryAttemptRow>(
      this.context.db.prepare("SELECT * FROM delivery_attempts WHERE id = ?").get(id),
    );
    return row ? attemptFromRow(row) : null;
  }
}
