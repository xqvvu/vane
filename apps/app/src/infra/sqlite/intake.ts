import "@tanstack/react-start/server-only";
import {
  decodeJson,
  decodeJsonObject,
  decodeSchemaJson,
  encodeJson,
  encodeJsonObject,
  EventRecordSchema,
  JsonObjectSchema,
  NormalizedEventSchema,
} from "@vane/core";
import type { EventRecord, JsonObject, JsonValue, NormalizedEvent } from "@vane/core";

import { rowOrUndefined, type SqliteJsonText } from "#/infra/sqlite/codecs.ts";
import type { SqliteRepositoryContext } from "#/infra/sqlite/context.ts";
import { RecordNotFoundError } from "#/infra/sqlite/errors.ts";
import type { IsoDateTimeString } from "#/infra/sqlite/types.ts";

export interface EventRow {
  id: string;
  source_id: string;
  idempotency_key: string | null;
  fingerprint: string;
  severity: string;
  status: string;
  title: string;
  message: string;
  labels_json: SqliteJsonText;
  normalized_json: SqliteJsonText;
  provider_metadata_json: SqliteJsonText;
  raw_payload_json: SqliteJsonText;
  raw_headers_json: SqliteJsonText;
  received_at: IsoDateTimeString;
  occurred_at: IsoDateTimeString;
  created_at: IsoDateTimeString;
}

export interface IntakeRepository {
  recordEvent(input: RecordEventInput): EventRecord;
}

export interface RecordEventInput {
  id?: string;
  sourceId: string;
  idempotencyKey: string | null;
  normalized: NormalizedEvent;
  providerMetadata?: JsonObject;
  rawPayload: JsonValue;
  rawHeaders?: Record<string, string>;
  receivedAt?: IsoDateTimeString;
  createdAt?: IsoDateTimeString;
}

export function eventFromRow(row: EventRow): EventRecord {
  return EventRecordSchema.parse({
    id: row.id,
    sourceId: row.source_id,
    idempotencyKey: row.idempotency_key,
    normalized: decodeSchemaJson(NormalizedEventSchema, row.normalized_json),
    providerMetadata: decodeJsonObject(row.provider_metadata_json),
    rawPayload: decodeJson(row.raw_payload_json),
    rawHeaders: decodeRawHeaders(row.raw_headers_json),
    receivedAt: row.received_at,
  });
}

export function requireEvent(event: EventRecord | null): EventRecord {
  if (!event) {
    throw new RecordNotFoundError("Event");
  }

  return event;
}

function decodeRawHeaders(value: string): Record<string, string> {
  return Object.fromEntries(
    Object.entries(decodeJsonObject(value)).map(([key, entry]) => [
      key,
      typeof entry === "string" ? entry : JSON.stringify(entry),
    ]),
  );
}

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
            received_at,
            occurred_at,
            created_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
}
