import type { SqliteStore } from "#/infra/sqlite/store.ts";

export interface RouteServiceOptions {
  store: SqliteStore;
}
