import { sql, type Kysely } from "kysely";

import type { VaneSqliteDatabaseSchema } from "#/infra/sqlite/schema";

export async function createBetterAuthTables(db: Kysely<VaneSqliteDatabaseSchema>): Promise<void> {
  await db.schema
    .createTable("user")
    .addColumn("id", "text", (column) => column.notNull().primaryKey())
    .addColumn("name", "text", (column) => column.notNull())
    .addColumn("email", "text", (column) => column.notNull().unique())
    .addColumn("email_verified", "integer", (column) => column.notNull())
    .addColumn("image", "text")
    .addColumn("created_at", "date", (column) => column.notNull())
    .addColumn("updated_at", "date", (column) => column.notNull())
    .addColumn("role", "text", (column) => column.notNull().defaultTo("member"))
    .addCheckConstraint("user_email_verified_bool_check", sql`email_verified IN (0, 1)`)
    .addCheckConstraint("user_role_check", sql`role IN ('owner', 'admin', 'member')`)
    .execute();

  await db.schema
    .createTable("session")
    .addColumn("id", "text", (column) => column.notNull().primaryKey())
    .addColumn("expires_at", "date", (column) => column.notNull())
    .addColumn("token", "text", (column) => column.notNull().unique())
    .addColumn("created_at", "date", (column) => column.notNull())
    .addColumn("updated_at", "date", (column) => column.notNull())
    .addColumn("ip_address", "text")
    .addColumn("user_agent", "text")
    .addColumn("user_id", "text", (column) =>
      column.notNull().references("user.id").onDelete("cascade"),
    )
    .execute();

  await db.schema
    .createTable("account")
    .addColumn("id", "text", (column) => column.notNull().primaryKey())
    .addColumn("account_id", "text", (column) => column.notNull())
    .addColumn("provider_id", "text", (column) => column.notNull())
    .addColumn("user_id", "text", (column) =>
      column.notNull().references("user.id").onDelete("cascade"),
    )
    .addColumn("access_token", "text")
    .addColumn("refresh_token", "text")
    .addColumn("id_token", "text")
    .addColumn("access_token_expires_at", "date")
    .addColumn("refresh_token_expires_at", "date")
    .addColumn("scope", "text")
    .addColumn("password", "text")
    .addColumn("created_at", "date", (column) => column.notNull())
    .addColumn("updated_at", "date", (column) => column.notNull())
    .execute();

  await db.schema
    .createTable("verification")
    .addColumn("id", "text", (column) => column.notNull().primaryKey())
    .addColumn("identifier", "text", (column) => column.notNull())
    .addColumn("value", "text", (column) => column.notNull())
    .addColumn("expires_at", "date", (column) => column.notNull())
    .addColumn("created_at", "date", (column) => column.notNull())
    .addColumn("updated_at", "date", (column) => column.notNull())
    .execute();
}

export async function createBetterAuthIndexes(db: Kysely<VaneSqliteDatabaseSchema>): Promise<void> {
  await db.schema.createIndex("session_user_id_idx").on("session").column("user_id").execute();
  await db.schema.createIndex("account_user_id_idx").on("account").column("user_id").execute();
  await db.schema
    .createIndex("verification_identifier_idx")
    .on("verification")
    .column("identifier")
    .execute();
}
