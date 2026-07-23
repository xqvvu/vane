import type { SqliteStore } from "#/infra/sqlite/store";

export interface RouteServiceOptions {
  store: SqliteStore;
}
