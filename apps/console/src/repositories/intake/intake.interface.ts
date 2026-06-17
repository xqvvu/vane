import type {
  EventRecord,
  JsonObject,
  JsonValue,
  NormalizedEvent,
  RouteMatchResult,
} from "@vane/core";

import type { SqliteJsonText } from "#/infra/sqlite/codecs.ts";
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
  route_matches_json: SqliteJsonText | null;
  received_at: IsoDateTimeString;
  occurred_at: IsoDateTimeString;
  created_at: IsoDateTimeString;
}

export interface IntakeRepository {
  recordEvent(input: RecordEventInput): EventRecord;
  pruneRawPayloads(input: PruneRawPayloadsInput): number;
}

export interface RecordEventInput {
  id?: string;
  sourceId: string;
  idempotencyKey: string | null;
  normalized: NormalizedEvent;
  providerMetadata?: JsonObject;
  rawPayload: JsonValue;
  rawHeaders?: Record<string, string>;
  routeMatches?: RouteMatchResult[];
  receivedAt?: IsoDateTimeString;
  createdAt?: IsoDateTimeString;
}

export interface PruneRawPayloadsInput {
  before: IsoDateTimeString;
}
