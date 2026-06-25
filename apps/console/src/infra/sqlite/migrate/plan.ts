import initialSchema from "#/infra/sqlite/migrate/0001_initial_schema.ts";
import type { SqliteMigration } from "#/infra/sqlite/migrate/types.ts";

export const sqliteSchemaPlan = [initialSchema] satisfies readonly SqliteMigration[];
