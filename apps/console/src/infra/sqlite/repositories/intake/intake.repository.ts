import {
  encodeJson,
  encodeJsonObject,
  encodeSchemaJson,
  JsonObjectSchema,
  RouteMatchResultsSchema,
} from "@vane/core";
import type { EventRecord } from "@vane/core";

import type { SqliteRepositoryContext } from "#/infra/sqlite/context.ts";
import {
  eventFromRow,
  PRUNED_RAW_PAYLOAD,
  requireEvent,
} from "#/infra/sqlite/repositories/intake/intake.helpers.ts";
import type {
  IntakeRepository,
  PruneRawPayloadsInput,
  RecordEventInput,
} from "#/infra/sqlite/repositories/intake/intake.interface.ts";

export class SqliteIntakeRepository implements IntakeRepository {
  constructor(private readonly context: SqliteRepositoryContext) {}

  async recordEvent(input: RecordEventInput): Promise<EventRecord> {
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

    await this.context.db
      .insertInto("events")
      .values({
        id,
        source_id: input.sourceId,
        idempotency_key: input.idempotencyKey,
        fingerprint: normalized.fingerprint,
        severity: normalized.severity,
        status: normalized.status,
        title: normalized.title,
        message: normalized.message,
        labels_json: encodeJsonObject(normalized.labels),
        normalized_json: encodeJson(normalized),
        provider_metadata_json: encodeJsonObject(providerMetadata),
        raw_payload_json: encodeJson(input.rawPayload),
        raw_headers_json: encodeJsonObject(rawHeaders),
        route_matches_json:
          routeMatches === null ? null : encodeSchemaJson(RouteMatchResultsSchema, routeMatches),
        received_at: receivedAt,
        occurred_at: normalized.occurredAt,
        created_at: createdAt,
      })
      .execute();

    return requireEvent(await this.get(id));
  }

  async get(id: string): Promise<EventRecord | null> {
    const row = await this.context.db
      .selectFrom("events")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();

    return row ? eventFromRow(row) : null;
  }

  async pruneRawPayloads(input: PruneRawPayloadsInput): Promise<number> {
    const prunedPayload = encodeJson(PRUNED_RAW_PAYLOAD);
    const result = await this.context.db
      .updateTable("events")
      .set({
        raw_payload_json: prunedPayload,
        raw_headers_json: encodeJsonObject({}),
      })
      .where("received_at", "<", input.before)
      .where("raw_payload_json", "!=", prunedPayload)
      .executeTakeFirst();

    return Number(result.numUpdatedRows);
  }
}
