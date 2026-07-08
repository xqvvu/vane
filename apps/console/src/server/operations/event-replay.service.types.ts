import type { SqliteStore } from "#/infra/sqlite/store.ts";

export interface EventReplayServiceOptions {
  store: SqliteStore;
  now?: () => string;
  dedupeWindowMs?: number;
}
