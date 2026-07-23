import { sql } from "kysely";
import { describe, expect, it } from "vitest";

import { createSqliteDatabase } from "#/infra/sqlite/connection";
import { SqliteRepositoryContext } from "#/infra/sqlite/context";
import { transaction } from "#/infra/sqlite/transaction";

describe("sqlite transactions", () => {
  it("rolls back a failed Kysely transaction", async () => {
    const db = createSqliteDatabase({ databasePath: ":memory:" });

    try {
      await sql`CREATE TABLE items (id TEXT PRIMARY KEY)`.execute(db);

      await expect(
        transaction(db, async (tx) => {
          await sql`INSERT INTO items (id) VALUES (${"outer"})`.execute(tx);
          throw new Error("transaction failure");
        }),
      ).rejects.toThrow("transaction failure");

      const result = await sql<{ id: string }>`SELECT id FROM items ORDER BY id`.execute(db);

      expect(result.rows).toEqual([]);
    } finally {
      await db.destroy();
    }
  });

  it("reuses the active transaction context for nested repository transactions", async () => {
    const db = createSqliteDatabase({ databasePath: ":memory:" });
    const context = new SqliteRepositoryContext({ db });

    try {
      await sql`CREATE TABLE items (id TEXT PRIMARY KEY)`.execute(db);

      await context.runInTransaction(async (outer) => {
        await sql`INSERT INTO items (id) VALUES (${"outer"})`.execute(outer.db);

        await outer.runInTransaction(async (inner) => {
          await sql`INSERT INTO items (id) VALUES (${"inner"})`.execute(inner.db);
        });
      });

      const result = await sql<{ id: string }>`SELECT id FROM items ORDER BY id`.execute(db);

      expect(result.rows).toEqual([{ id: "inner" }, { id: "outer" }]);
    } finally {
      await db.destroy();
    }
  });
});
