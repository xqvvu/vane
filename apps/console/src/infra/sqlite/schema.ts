import type { ColumnType, Kysely, Transaction } from "kysely";

import type {
  AlertSeverity,
  AlertStatus,
  DeliveryAttempt,
  DeliveryJob,
  DestinationKind,
  SourceProvider,
} from "@vane/core";

import type { SqliteBoolean, SqliteJsonText } from "#/infra/sqlite/codecs";

export type SqliteGenerated<T> = ColumnType<T, T | undefined, T>;

export interface VaneSqliteDatabaseSchema {
  account: BetterAuthAccountTable;
  deliveries: DeliveriesTable;
  delivery_attempts: DeliveryAttemptsTable;
  delivery_dedupe_keys: DeliveryDedupeKeysTable;
  destinations: DestinationsTable;
  events: EventsTable;
  routes: RoutesTable;
  schema_migrations: SchemaMigrationsTable;
  session: BetterAuthSessionTable;
  settings: SettingsTable;
  sources: SourcesTable;
  user: BetterAuthUserTable;
  verification: BetterAuthVerificationTable;
}

export type VaneSqliteKysely = Kysely<VaneSqliteDatabaseSchema>;
export type VaneSqliteTransaction = Transaction<VaneSqliteDatabaseSchema>;
export type VaneSqliteExecutor = VaneSqliteKysely | VaneSqliteTransaction;

export interface SettingsTable {
  key: string;
  value: string;
  updated_at: string;
}

export interface SourcesTable {
  id: string;
  name: string;
  provider: SourceProvider;
  token_hash: string;
  enabled: SqliteGenerated<SqliteBoolean>;
  config_json: SqliteGenerated<SqliteJsonText>;
  created_at: string;
  updated_at: string;
}

export interface EventsTable {
  id: string;
  source_id: string;
  idempotency_key: string | null;
  fingerprint: string;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  message: string;
  labels_json: string;
  normalized_json: string;
  provider_metadata_json: string;
  raw_payload_json: string;
  raw_headers_json: string;
  received_at: string;
  occurred_at: string;
  created_at: string;
  route_matches_json: string | null;
}

export interface DestinationsTable {
  id: string;
  name: string;
  kind: DestinationKind;
  enabled: SqliteGenerated<SqliteBoolean>;
  config_json: SqliteGenerated<SqliteJsonText>;
  secret_refs_json: SqliteGenerated<SqliteJsonText>;
  created_at: string;
  updated_at: string;
}

export interface RoutesTable {
  id: string;
  name: string;
  enabled: SqliteGenerated<SqliteBoolean>;
  rule_json: SqliteJsonText;
  destination_ids_json: SqliteJsonText;
  created_at: string;
  updated_at: string;
}

export interface DeliveriesTable {
  id: string;
  event_id: string;
  destination_id: string;
  route_id: string | null;
  state: DeliveryJob["state"];
  attempt_count: SqliteGenerated<number>;
  max_attempts: SqliteGenerated<number>;
  next_attempt_at: string | null;
  last_error: string | null;
  rendered_payload_json: string | null;
  created_at: string;
  updated_at: string;
  finished_at: string | null;
}

export interface DeliveryAttemptsTable {
  id: string;
  delivery_id: string;
  attempt_number: number;
  state: DeliveryAttempt["state"];
  response_status: number | null;
  response_body: string | null;
  error: string | null;
  started_at: string;
  finished_at: string | null;
}

export interface DeliveryDedupeKeysTable {
  source_id: string;
  idempotency_key: string;
  route_id: string;
  destination_id: string;
  first_event_id: string;
  created_at: string;
}

export interface SchemaMigrationsTable {
  version: string;
  name: string;
  applied_at: string;
}

export interface BetterAuthUserTable {
  id: string;
  name: string;
  email: string;
  email_verified: number;
  image: string | null;
  created_at: string;
  updated_at: string;
  role: SqliteGenerated<string>;
}

export interface BetterAuthSessionTable {
  id: string;
  expires_at: string;
  token: string;
  created_at: string;
  updated_at: string;
  ip_address: string | null;
  user_agent: string | null;
  user_id: string;
}

export interface BetterAuthAccountTable {
  id: string;
  account_id: string;
  provider_id: string;
  user_id: string;
  access_token: string | null;
  refresh_token: string | null;
  id_token: string | null;
  access_token_expires_at: string | null;
  refresh_token_expires_at: string | null;
  scope: string | null;
  password: string | null;
  created_at: string;
  updated_at: string;
}

export interface BetterAuthVerificationTable {
  id: string;
  identifier: string;
  value: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}
