import type { VaneSqliteKysely, VaneSqliteTransaction } from "#/infra/sqlite/schema.ts";

export function transaction<T>(
  db: VaneSqliteKysely,
  fn: (tx: VaneSqliteTransaction) => Promise<T>,
): Promise<T> {
  return db.transaction().execute(fn);
}
