import { decodeJson, DeliveryJobSchema, redactText } from "@vane/core";
import type { DeliveryAttempt, DeliveryJob, JsonValue } from "@vane/core";

import type { SqliteDatabase } from "#/infra/sqlite/connection.ts";
import { RecordNotFoundError } from "#/infra/sqlite/errors.ts";
import type {
  DeliveryAttemptRow,
  DeliveryDedupeKeyRow,
  DeliveryRow,
} from "#/repositories/delivery/delivery.interface.ts";

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

export function reserveDedupeKey(
  db: SqliteDatabase,
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

export function pruneDedupeKeys(db: SqliteDatabase, startsAt: string): void {
  db.prepare("DELETE FROM delivery_dedupe_keys WHERE created_at < ?").run(startsAt);
}

export function redactNullableText(value: string | null | undefined): string | null {
  return value === null || value === undefined ? null : redactText(value);
}
