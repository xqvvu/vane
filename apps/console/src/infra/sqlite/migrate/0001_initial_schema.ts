import {
  createBetterAuthIndexes,
  createBetterAuthTables,
} from "#/infra/sqlite/migrate/better-auth.schema.ts";
import { createVaneIndexes, createVaneTables } from "#/infra/sqlite/migrate/schema.ts";
import { defineSqliteMigration } from "#/infra/sqlite/migrate/types.ts";
import type { VaneSqliteDatabaseSchema } from "#/infra/sqlite/schema.ts";

export default defineSqliteMigration<VaneSqliteDatabaseSchema>({
  version: "0001",
  name: "initial schema",
  filename: "0001_initial_schema.ts",
  async up(db) {
    await createVaneTables(db);
    await createBetterAuthTables(db);
    await createVaneIndexes(db);
    await createBetterAuthIndexes(db);
  },
});
