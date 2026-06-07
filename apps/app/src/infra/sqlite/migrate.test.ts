import sqlite from "node:sqlite";

import { describe, expect, it } from "vitest";

import { getAppliedMigrationVersions, migrateSqliteDatabase } from "#/infra/sqlite/migrate.ts";
import { SqliteStore } from "#/infra/sqlite/store.ts";

describe("sqlite migrations", () => {
  it("applies explicit forward migrations and records the ledger", () => {
    const db = new sqlite.DatabaseSync(":memory:");
    db.exec("PRAGMA foreign_keys = ON");

    const result = migrateSqliteDatabase(db);

    expect(result.applied.map((migration) => migration.version)).toEqual(["0001"]);
    expect(getAppliedMigrationVersions(db)).toEqual(new Set(["0001"]));
    expect(new SqliteStore(db).schemaVersion).toBe("0001");

    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
      .all()
      .map((row) => (row as { name: string }).name);

    expect(tables).toEqual([
      "deliveries",
      "delivery_attempts",
      "delivery_dedupe_keys",
      "destinations",
      "events",
      "routes",
      "schema_migrations",
      "settings",
      "sources",
    ]);
  });

  it("skips already-applied migrations", () => {
    const db = new sqlite.DatabaseSync(":memory:");

    migrateSqliteDatabase(db);
    const result = migrateSqliteDatabase(db);

    expect(result.applied).toHaveLength(0);
    expect(result.skipped.map((migration) => migration.version)).toEqual(["0001"]);
  });
});
