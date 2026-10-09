import type { SqliteDatabase, SqliteTransaction } from "#/infra/sqlite/schema";

export function transaction<T>(
  db: SqliteDatabase,
  fn: (tx: SqliteTransaction) => Promise<T>,
): Promise<T> {
  return db.transaction().execute(fn);
}
