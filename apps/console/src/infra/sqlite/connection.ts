import "@tanstack/react-start/server-only";
import fs from "node:fs";
import type { PathLike } from "node:fs";
import path from "node:path";
import process from "node:process";

import Database from "better-sqlite3";

export type SqliteDatabase = Database.Database;

export interface CreateSqliteDatabaseOptions {
  databasePath?: PathLike;
}

export function createSqliteDatabase(options: CreateSqliteDatabaseOptions = {}): SqliteDatabase {
  const databasePath = String(options.databasePath ?? path.join(process.cwd(), "data.sqlite"));

  if (databasePath !== ":memory:") {
    fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  }

  const db = new Database(databasePath, {
    timeout: 5000,
  });

  db.pragma("foreign_keys = ON");

  if (databasePath !== ":memory:") {
    db.pragma("journal_mode = WAL");
    db.pragma("busy_timeout = 5000");
  }

  return db;
}
