import "@tanstack/react-start/server-only";
import type { PathLike } from "node:fs";
import path from "node:path";
import sqlite from "node:sqlite";

import { migrateSqliteDatabase } from "#/infra/sqlite/migrate.ts";

interface ISqliteStore {
  get schemaVersion(): string | null;
}

export function createSqliteDatabase(databasePath?: PathLike): sqlite.DatabaseSync {
  if (!databasePath) {
    databasePath = path.join(import.meta.dirname, "data.sqlite");
  }

  const db = new sqlite.DatabaseSync(databasePath, {});
  db.exec("PRAGMA foreign_keys = ON");
  return db;
}

export function createMigratedSqliteDatabase(databasePath?: PathLike): sqlite.DatabaseSync {
  const db = createSqliteDatabase(databasePath);
  migrateSqliteDatabase(db);
  return db;
}

export class SqliteStore implements ISqliteStore {
  constructor(private readonly db: sqlite.DatabaseSync) {}

  get schemaVersion(): string | null {
    const row = this.db.prepare("SELECT value FROM settings WHERE key = 'schema_version'").get() as
      | { value: string }
      | undefined;

    return row?.value ?? null;
  }
}
