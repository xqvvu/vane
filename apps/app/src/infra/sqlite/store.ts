import "@tanstack/react-start/server-only";
import type { PathLike } from "node:fs";
import path from "node:path";
import sqlite from "node:sqlite";

interface ISqliteStore {
  get version(): string;
}

export function createSqliteDatabase(databasePath?: PathLike) {
  if (!databasePath) {
    databasePath = path.join(import.meta.dirname, "data.sqlite");
  }

  return new sqlite.DatabaseSync(databasePath, {});
}

export class SqliteStore implements ISqliteStore {
  constructor(private readonly db: sqlite.DatabaseSync) {}

  get version(): string {
    return this.db.exec("SELECT value FROM settings WHERE key = 'version'");
  }
}
