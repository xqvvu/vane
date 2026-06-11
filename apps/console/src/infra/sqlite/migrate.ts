import "@tanstack/react-start/server-only";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import type { SqliteDatabase } from "#/infra/sqlite/connection.ts";
import { transaction } from "#/infra/sqlite/transaction.ts";

export interface Migration {
  version: string;
  name: string;
  filename: string;
  sql: string;
}

export interface MigrationResult {
  applied: Migration[];
  skipped: Migration[];
}

const MIGRATION_FILE_PATTERN = /^(\d{4})_(.+)\.sql$/;

export function migrateSqliteDatabase(
  db: SqliteDatabase,
  migrationsDir = resolveDefaultMigrationsDir(),
): MigrationResult {
  ensureMigrationLedger(db);

  const migrations = readMigrations(migrationsDir);
  const appliedVersions = getAppliedMigrationVersions(db);
  const result: MigrationResult = {
    applied: [],
    skipped: [],
  };

  for (const migration of migrations) {
    if (appliedVersions.has(migration.version)) {
      result.skipped.push(migration);
      continue;
    }

    transaction(db, () => {
      db.exec(migration.sql);
      db.prepare("INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)").run(
        migration.version,
        migration.name,
        new Date().toISOString(),
      );
    });
    appliedVersions.add(migration.version);
    result.applied.push(migration);
  }

  return result;
}

export function readMigrations(migrationsDir: string): Migration[] {
  return fs
    .readdirSync(migrationsDir)
    .map((filename) => {
      const match = MIGRATION_FILE_PATTERN.exec(filename);

      if (!match) {
        return null;
      }

      const [, version, rawName] = match;

      return {
        version,
        name: rawName.replaceAll("_", " "),
        filename,
        sql: fs.readFileSync(path.join(migrationsDir, filename), "utf8"),
      };
    })
    .filter((migration): migration is Migration => migration !== null)
    .sort((left, right) => left.version.localeCompare(right.version));
}

export function getAppliedMigrationVersions(db: SqliteDatabase): Set<string> {
  const rows = db.prepare("SELECT version FROM schema_migrations ORDER BY version").all() as Array<{
    version: string;
  }>;
  return new Set(rows.map((row) => row.version));
}

function ensureMigrationLedger(db: SqliteDatabase): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL
    )
  `);
}

function resolveDefaultMigrationsDir(): string {
  const candidates = [
    path.join(import.meta.dirname, "migrations"),
    path.join(process.cwd(), "src/infra/sqlite/migrations"),
    path.join(process.cwd(), "apps/console/src/infra/sqlite/migrations"),
  ];

  const migrationsDir = candidates.find((candidate) => fs.existsSync(candidate));

  if (!migrationsDir) {
    throw new Error(
      `Unable to locate SQLite migrations directory. Checked: ${candidates.join(", ")}`,
    );
  }

  return migrationsDir;
}
