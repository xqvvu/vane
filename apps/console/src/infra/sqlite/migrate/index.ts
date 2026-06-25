export {
  getAppliedMigrationVersions,
  migrateSqliteDatabase,
  normalizeSqliteSchemaPlan,
  readSqliteSchemaPlan,
  type MigrateSqliteDatabaseOptions,
} from "#/infra/sqlite/migrate/runner.ts";
export { sqliteSchemaPlan } from "#/infra/sqlite/migrate/plan.ts";
export {
  defineSqliteMigration,
  type MigrationResult,
  type SqliteMigration,
  type SqliteMigrationDb,
} from "#/infra/sqlite/migrate/types.ts";
