import type { SqliteStore } from "#/infra/sqlite/store";

export interface EventReplayServiceOptions {
  store: SqliteStore;
  now?: () => string;
  dedupeWindowMs?: number;
}
