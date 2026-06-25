import "@tanstack/react-start/server-only";
import { betterAuth } from "better-auth";

import { createSqliteDatabase } from "#/infra/sqlite/connection.ts";
import { createBaseBetterAuthOptions } from "#/lib/auth-options.ts";

const db = createSqliteDatabase({ databasePath: ":memory:" });

export const auth = betterAuth({
  ...createBaseBetterAuthOptions(),
  database: {
    db,
    type: "sqlite",
    casing: "snake",
  },
  secret: "better-auth-cli-schema-generation-secret",
});
