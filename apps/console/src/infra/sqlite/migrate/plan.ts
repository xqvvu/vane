import initialSchema from "#/infra/sqlite/migrate/0001_initial_schema";
import type { SqliteMigration } from "#/infra/sqlite/migrate/types";

export const sqliteSchemaPlan = [initialSchema] satisfies readonly SqliteMigration[];
