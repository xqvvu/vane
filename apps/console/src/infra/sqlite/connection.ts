import "@tanstack/react-start/server-only";
import fs from "node:fs";
import type { PathLike } from "node:fs";
import path from "node:path";
import process from "node:process";

import Sqlite from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";

import type { VaneSqliteDatabaseSchema, VaneSqliteKysely } from "#/infra/sqlite/schema.ts";

export interface CreateSqliteDatabaseOptions {
  databasePath?: PathLike;
}

export function createSqliteDatabase(options: CreateSqliteDatabaseOptions = {}): VaneSqliteKysely {
  const databasePath = String(options.databasePath ?? path.join(process.cwd(), "data.sqlite"));

  if (databasePath !== ":memory:") {
    fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  }

  const sqlite = new Sqlite(databasePath, {
    timeout: 5000,
  });

  sqlite.pragma("foreign_keys = ON");

  if (databasePath !== ":memory:") {
    sqlite.pragma("journal_mode = WAL");
    sqlite.pragma("busy_timeout = 5000");
  }

  return new Kysely<VaneSqliteDatabaseSchema>({
    dialect: new SqliteDialect({
      database: sqlite,
    }),
  });
}
