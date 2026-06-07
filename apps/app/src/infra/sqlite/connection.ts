import "@tanstack/react-start/server-only";
import type { PathLike } from "node:fs";
import path from "node:path";
import sqlite from "node:sqlite";

export interface CreateSqliteDatabaseOptions {
  databasePath?: PathLike;
}

export function createSqliteDatabase(
  options: CreateSqliteDatabaseOptions = {},
): sqlite.DatabaseSync {
  const databasePath = options.databasePath ?? path.join(import.meta.dirname, "data.sqlite");
  const db = new sqlite.DatabaseSync(databasePath, {});

  db.exec("PRAGMA foreign_keys = ON");

  if (databasePath !== ":memory:") {
    db.exec("PRAGMA journal_mode = WAL");
    db.exec("PRAGMA busy_timeout = 5000");
  }

  return db;
}
