import type { SqliteKysely, SqliteTransaction } from "#/infra/sqlite/schema";

export function transaction<T>(
  db: SqliteKysely,
  fn: (tx: SqliteTransaction) => Promise<T>,
): Promise<T> {
  return db.transaction().execute(fn);
}
