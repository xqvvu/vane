import {
  encodeJson,
  encodeJsonObject,
  encodeSchemaJson,
  JsonObjectSchema,
  RouteMatchResultsSchema,
} from "@vane/core";
import type { EventRecord } from "@vane/core";

import { rowOrUndefined } from "#/infra/sqlite/codecs.ts";
import type { SqliteRepositoryContext } from "#/infra/sqlite/context.ts";
import {
  eventFromRow,
  PRUNED_RAW_PAYLOAD,
  requireEvent,
} from "#/repositories/intake/intake.helpers.ts";
import type {
  EventRow,
  IntakeRepository,
  PruneRawPayloadsInput,
  RecordEventInput,
} from "#/repositories/intake/intake.interface.ts";

export class SqliteIntakeRepository implements IntakeRepository {
  constructor(private readonly context: SqliteRepositoryContext) {}

  recordEvent(input: RecordEventInput): EventRecord {
    const now = this.context.now();
    const id = input.id ?? this.context.ids.event();
    const receivedAt = input.receivedAt ?? now;
    const createdAt = input.createdAt ?? receivedAt;
    const normalized = input.normalized;
    const providerMetadata = JsonObjectSchema.parse(input.providerMetadata ?? {});
    const rawHeaders = JsonObjectSchema.parse(input.rawHeaders ?? {});
    const routeMatches = input.routeMatches
      ? RouteMatchResultsSchema.parse(input.routeMatches)
      : null;

    this.context.db
      .prepare(
        `
          INSERT INTO events (
            id,
            source_id,
            idempotency_key,
            fingerprint,
            severity,
            status,
            title,
            message,
            labels_json,
            normalized_json,
            provider_metadata_json,
            raw_payload_json,
            raw_headers_json,
            route_matches_json,
            received_at,
            occurred_at,
            created_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
      )
      .run(
        id,
        input.sourceId,
        input.idempotencyKey,
        normalized.fingerprint,
        normalized.severity,
        normalized.status,
        normalized.title,
        normalized.message,
        encodeJsonObject(normalized.labels),
        encodeJson(normalized),
        encodeJsonObject(providerMetadata),
        encodeJson(input.rawPayload),
        encodeJsonObject(rawHeaders),
        routeMatches === null ? null : encodeSchemaJson(RouteMatchResultsSchema, routeMatches),
        receivedAt,
        normalized.occurredAt,
        createdAt,
      );

    return requireEvent(this.get(id));
  }

  get(id: string): EventRecord | null {
    const row = rowOrUndefined<EventRow>(
      this.context.db.prepare("SELECT * FROM events WHERE id = ?").get(id),
    );
    return row ? eventFromRow(row) : null;
  }

  pruneRawPayloads(input: PruneRawPayloadsInput): number {
    const prunedPayload = encodeJson(PRUNED_RAW_PAYLOAD);
    const result = this.context.db
      .prepare(
        `
          UPDATE events
          SET raw_payload_json = ?, raw_headers_json = ?
          WHERE received_at < ? AND raw_payload_json != ?
        `,
      )
      .run(prunedPayload, encodeJsonObject({}), input.before, prunedPayload);

    return result.changes;
  }
}
