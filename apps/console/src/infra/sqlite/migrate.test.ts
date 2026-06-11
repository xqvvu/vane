import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { createSqliteDatabase } from "#/infra/sqlite/connection.ts";
import { SqliteRepositoryContext } from "#/infra/sqlite/context.ts";
import { getAppliedMigrationVersions, migrateSqliteDatabase } from "#/infra/sqlite/migrate.ts";
import { OpenedSqliteStore } from "#/infra/sqlite/store.ts";

describe("sqlite migrations", () => {
  it("applies explicit forward migrations and records the ledger", () => {
    const db = createSqliteDatabase({ databasePath: ":memory:" });

    const result = migrateSqliteDatabase(db);

    expect(result.applied.map((migration) => migration.version)).toEqual([
      "0001",
      "0002",
      "0003",
      "0004",
      "0005",
    ]);
    expect(getAppliedMigrationVersions(db)).toEqual(
      new Set(["0001", "0002", "0003", "0004", "0005"]),
    );
    const store = new OpenedSqliteStore(db, new SqliteRepositoryContext({ db }));

    expect(store.schemaVersion).toBe("0005");
    expect(store.settings.get().rawPayloadRetentionDays).toBe(30);

    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
      .all()
      .map((row) => (row as { name: string }).name);

    expect(tables).toEqual([
      "account",
      "deliveries",
      "delivery_attempts",
      "delivery_dedupe_keys",
      "destinations",
      "events",
      "routes",
      "schema_migrations",
      "session",
      "settings",
      "sources",
      "user",
      "verification",
    ]);

    const userColumns = db
      .prepare('PRAGMA table_info("user")')
      .all()
      .map((row) => (row as { name: string }).name);

    expect(userColumns).toContain("role");

    const eventColumns = db
      .prepare("PRAGMA table_info(events)")
      .all()
      .map((row) => (row as { name: string }).name);

    expect(eventColumns).toContain("route_matches_json");
  });

  it("skips already-applied migrations", () => {
    const db = createSqliteDatabase({ databasePath: ":memory:" });

    migrateSqliteDatabase(db);
    const result = migrateSqliteDatabase(db);

    expect(result.applied).toHaveLength(0);
    expect(result.skipped.map((migration) => migration.version)).toEqual([
      "0001",
      "0002",
      "0003",
      "0004",
      "0005",
    ]);
  });

  it("promotes the earliest existing auth user to owner when upgrading old databases", () => {
    const db = createSqliteDatabase({ databasePath: ":memory:" });
    const previousMigrationsDir = createMigrationsSubset(["0001", "0002", "0003"]);

    try {
      migrateSqliteDatabase(db, previousMigrationsDir);
      db.prepare(
        `
          INSERT INTO "user" ("id", "name", "email", "emailVerified", "createdAt", "updatedAt")
          VALUES (?, ?, ?, ?, ?, ?)
        `,
      ).run(
        "user-later",
        "Later User",
        "later@example.test",
        0,
        "2026-06-09T09:00:00.000Z",
        "2026-06-09T09:00:00.000Z",
      );
      db.prepare(
        `
          INSERT INTO "user" ("id", "name", "email", "emailVerified", "createdAt", "updatedAt")
          VALUES (?, ?, ?, ?, ?, ?)
        `,
      ).run(
        "user-earliest",
        "Earliest User",
        "earliest@example.test",
        0,
        "2026-06-09T08:00:00.000Z",
        "2026-06-09T08:00:00.000Z",
      );

      const result = migrateSqliteDatabase(db);

      expect(result.applied.map((migration) => migration.version)).toEqual(["0004", "0005"]);
      expect(db.prepare('SELECT "id", "role" FROM "user" ORDER BY "createdAt" ASC').all()).toEqual([
        {
          id: "user-earliest",
          role: "owner",
        },
        {
          id: "user-later",
          role: "member",
        },
      ]);
    } finally {
      fs.rmSync(previousMigrationsDir, { force: true, recursive: true });
    }
  });
});

function createMigrationsSubset(versions: string[]): string {
  const sourceDir = path.join(import.meta.dirname, "migrations");
  const targetDir = fs.mkdtempSync(path.join(os.tmpdir(), "vane-migrations-"));

  for (const filename of fs.readdirSync(sourceDir)) {
    if (versions.some((version) => filename.startsWith(`${version}_`))) {
      fs.copyFileSync(path.join(sourceDir, filename), path.join(targetDir, filename));
    }
  }

  return targetDir;
}
