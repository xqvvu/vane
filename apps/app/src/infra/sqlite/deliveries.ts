import "@tanstack/react-start/server-only";
import type sqlite from "node:sqlite";

import { decodeJson, DeliveryJobSchema, encodeJson } from "@vane/core";
import type {
  DeliveryJob,
  DestinationSummary,
  EventRecord,
  JsonValue,
  RouteDefinition,
  SourceSummary,
} from "@vane/core";

import { rowAs, rowOrUndefined, rowsAs, type SqliteJsonText } from "#/infra/sqlite/codecs.ts";
import type { SqliteRepositoryContext } from "#/infra/sqlite/context.ts";
import {
  destinationSummaryFromRuntime,
  requireDestination,
  type DestinationRepository,
  type DestinationRuntimeConfig,
} from "#/infra/sqlite/destinations.ts";
import { RecordNotFoundError } from "#/infra/sqlite/errors.ts";
import { requireEvent, type SqliteIntakeRepository } from "#/infra/sqlite/intake.ts";
import type { RouteRepository } from "#/infra/sqlite/routes.ts";
import {
  requireSource,
  sourceSummaryFromRuntime,
  type SourceRepository,
  type SourceRuntimeConfig,
} from "#/infra/sqlite/sources.ts";
import type { IsoDateTimeString } from "#/infra/sqlite/types.ts";

export interface DeliveryRow {
  id: string;
  event_id: string;
  destination_id: string;
  route_id: string | null;
  state: DeliveryJob["state"];
  attempt_count: number;
  max_attempts: number;
  next_attempt_at: IsoDateTimeString | null;
  last_error: string | null;
  rendered_payload_json: SqliteJsonText | null;
  created_at: IsoDateTimeString;
  updated_at: IsoDateTimeString;
  finished_at: IsoDateTimeString | null;
}

export interface DeliveryAttemptRow {
  id: string;
  delivery_id: string;
  attempt_number: number;
  state: "running" | "succeeded" | "failed";
  response_status: number | null;
  response_body: string | null;
  error: string | null;
  started_at: IsoDateTimeString;
  finished_at: IsoDateTimeString | null;
}

export interface DeliveryDedupeKeyRow {
  source_id: string;
  idempotency_key: string;
  route_id: string;
  destination_id: string;
  first_event_id: string;
  created_at: IsoDateTimeString;
}

export interface DeliveryRepository {
  enqueueForEvent(input: EnqueueDeliveriesInput): EnqueueDeliveriesResult;
  claimNext(input: ClaimDeliveriesInput): ClaimedDelivery[];
  markSucceeded(input: MarkDeliverySucceededInput): DeliveryJob;
  markFailed(input: MarkDeliveryFailedInput): DeliveryJob;
  retryNow(input: RetryDeliveryInput): DeliveryJob;
  get(id: string): DeliveryDetail | null;
}

export interface DeliveryAttempt {
  id: string;
  deliveryId: string;
  attemptNumber: number;
  state: "running" | "succeeded" | "failed";
  responseStatus: number | null;
  responseBody: string | null;
  error: string | null;
  startedAt: IsoDateTimeString;
  finishedAt: IsoDateTimeString | null;
}

export interface EnqueueDeliveriesInput {
  event: EventRecord;
  matches: Array<{
    routeId: string;
    destinationIds: string[];
  }>;
  dedupeWindowStartsAt: IsoDateTimeString;
  now?: IsoDateTimeString;
  maxAttempts?: number;
}

export interface EnqueueDeliveriesResult {
  created: DeliveryJob[];
  deduped: DedupedDelivery[];
}

export interface DedupedDelivery {
  sourceId: string;
  idempotencyKey: string;
  routeId: string;
  destinationId: string;
  firstEventId: string;
}

export interface ClaimDeliveriesInput {
  now?: IsoDateTimeString;
  limit: number;
}

export interface ClaimedDelivery {
  job: DeliveryJob;
  attempt: DeliveryAttempt;
  event: EventRecord;
  source: SourceRuntimeConfig;
  destination: DestinationRuntimeConfig;
  route: RouteDefinition | null;
}

export interface MarkDeliverySucceededInput {
  deliveryId: string;
  attemptId: string;
  renderedPayload?: JsonValue;
  responseStatus?: number;
  responseBody?: string;
  finishedAt?: IsoDateTimeString;
}

export interface MarkDeliveryFailedInput {
  deliveryId: string;
  attemptId: string;
  error: string;
  retryAt: IsoDateTimeString | null;
  responseStatus?: number;
  responseBody?: string;
  finishedAt?: IsoDateTimeString;
}

export interface RetryDeliveryInput {
  deliveryId: string;
  requestedAt?: IsoDateTimeString;
}

export interface DeliveryDetail {
  job: DeliveryJob;
  event: EventRecord;
  source: SourceSummary;
  destination: DestinationSummary;
  route: RouteDefinition | null;
  renderedPayload: JsonValue | null;
  attempts: DeliveryAttempt[];
}

export function deliveryFromRow(row: DeliveryRow): DeliveryJob {
  return DeliveryJobSchema.parse({
    id: row.id,
    eventId: row.event_id,
    destinationId: row.destination_id,
    routeId: row.route_id,
    state: row.state,
    attemptCount: row.attempt_count,
    maxAttempts: row.max_attempts,
    nextAttemptAt: row.next_attempt_at,
    lastError: row.last_error,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    finishedAt: row.finished_at,
  });
}

export function attemptFromRow(row: DeliveryAttemptRow): DeliveryAttempt {
  return {
    id: row.id,
    deliveryId: row.delivery_id,
    attemptNumber: row.attempt_number,
    state: row.state,
    responseStatus: row.response_status,
    responseBody: row.response_body,
    error: row.error,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
  };
}

export function decodeRenderedPayload(value: string | null): JsonValue | null {
  return value === null ? null : decodeJson(value);
}

export function requireDelivery(delivery: DeliveryJob | null): DeliveryJob {
  if (!delivery) {
    throw new RecordNotFoundError("Delivery");
  }

  return delivery;
}

export function requireAttempt(attempt: DeliveryAttempt | null): DeliveryAttempt {
  if (!attempt) {
    throw new RecordNotFoundError("Delivery attempt");
  }

  return attempt;
}

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

  claimNext(input: ClaimDeliveriesInput): ClaimedDelivery[] {
    return this.context.runInTransaction(() => {
      const now = input.now ?? this.context.now();
      const rows = rowsAs<DeliveryRow>(
        this.context.db
          .prepare(
            `
              SELECT *
              FROM deliveries
              WHERE state = 'pending'
                AND (next_attempt_at IS NULL OR next_attempt_at <= ?)
                AND attempt_count < max_attempts
              ORDER BY COALESCE(next_attempt_at, created_at), created_at
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
          input.responseBody ?? null,
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
          input.responseBody ?? null,
          input.error,
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
          input.error,
          finishedAt,
          finishedDeliveryAt,
          input.deliveryId,
        );

      return requireDelivery(this.getJob(input.deliveryId));
    });
  }

  retryNow(input: RetryDeliveryInput): DeliveryJob {
    const requestedAt = input.requestedAt ?? this.context.now();

    this.context.db
      .prepare(
        `
          UPDATE deliveries
          SET state = 'pending', next_attempt_at = ?, last_error = NULL, updated_at = ?, finished_at = NULL
          WHERE id = ?
        `,
      )
      .run(requestedAt, requestedAt, input.deliveryId);

    return requireDelivery(this.getJob(input.deliveryId));
  }

  get(id: string): DeliveryDetail | null {
    const job = this.getJob(id);

    if (!job) {
      return null;
    }

    const event = requireEvent(this.intake.get(job.eventId));
    const source = sourceSummaryFromRuntime(requireSource(this.sources.get(event.sourceId)));
    const destination = destinationSummaryFromRuntime(
      requireDestination(this.destinations.get(job.destinationId)),
    );
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

function reserveDedupeKey(
  db: sqlite.DatabaseSync,
  row: DeliveryDedupeKeyRow,
): DeliveryDedupeKeyRow | null {
  const existing = db
    .prepare(
      `
        SELECT *
        FROM delivery_dedupe_keys
        WHERE source_id = ?
          AND idempotency_key = ?
          AND route_id = ?
          AND destination_id = ?
      `,
    )
    .get(row.source_id, row.idempotency_key, row.route_id, row.destination_id) as
    | DeliveryDedupeKeyRow
    | undefined;

  if (existing) {
    return existing;
  }

  db.prepare(
    `
      INSERT INTO delivery_dedupe_keys (
        source_id,
        idempotency_key,
        route_id,
        destination_id,
        first_event_id,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `,
  ).run(
    row.source_id,
    row.idempotency_key,
    row.route_id,
    row.destination_id,
    row.first_event_id,
    row.created_at,
  );

  return null;
}

function pruneDedupeKeys(db: sqlite.DatabaseSync, startsAt: string): void {
  db.prepare("DELETE FROM delivery_dedupe_keys WHERE created_at < ?").run(startsAt);
}
