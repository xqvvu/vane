import type { SqliteDatabase } from "#/infra/sqlite/connection.ts";

type PromiseLikeReturn<T> = Extract<T, PromiseLike<unknown>>;

export type SyncTransactionGuard<T> = [PromiseLikeReturn<T>] extends [never]
  ? []
  : ["SQLite transaction callbacks must be synchronous"];

export function transaction<T>(
  db: SqliteDatabase,
  fn: () => T,
  ..._guard: SyncTransactionGuard<T>
): T {
  return db.transaction(fn).immediate();
}
