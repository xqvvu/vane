import { describe, expect, it } from "vitest";

import { createSqliteDatabase } from "#/infra/sqlite/connection.ts";
import { SqliteRepositoryContext } from "#/infra/sqlite/context.ts";
import { transaction } from "#/infra/sqlite/transaction.ts";

describe("sqlite transactions", () => {
  it("rolls nested transactions back to a savepoint without aborting the outer transaction", () => {
    const db = createSqliteDatabase({ databasePath: ":memory:" });
    const context = new SqliteRepositoryContext({ db });

    db.exec("CREATE TABLE items (id TEXT PRIMARY KEY)");

    context.runInTransaction(() => {
      db.prepare("INSERT INTO items (id) VALUES (?)").run("outer");

      expect(() =>
        context.runInTransaction(() => {
          db.prepare("INSERT INTO items (id) VALUES (?)").run("inner");
          throw new Error("nested failure");
        }),
      ).toThrow("nested failure");

      db.prepare("INSERT INTO items (id) VALUES (?)").run("after");
    });

    expect(db.prepare("SELECT id FROM items ORDER BY id").all()).toEqual([
      { id: "after" },
      { id: "outer" },
    ]);

    db.close();
  });

  it("rejects async transaction callbacks", () => {
    const db = createSqliteDatabase({ databasePath: ":memory:" });
    const asyncCallback = (() => Promise.resolve("async")) as () => unknown;

    expect(() => transaction(db, asyncCallback)).toThrow(
      "Transaction function cannot return a promise",
    );

    db.close();
  });
});
