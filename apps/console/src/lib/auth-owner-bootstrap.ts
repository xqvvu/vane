import "@tanstack/react-start/server-only";
import { APIError } from "better-auth/api";

import type { VaneSqliteKysely } from "#/infra/sqlite/schema";

export interface BetterAuthUserCreateInput {
  id: string;
  name: string;
  email: string;
  emailVerified?: boolean;
  image?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  role?: string | null;
}

export interface RegisteredUserCounter {
  hasRegisteredUsers(): Promise<boolean>;
}

export async function assignOwnerRoleBeforeUserCreate(
  user: BetterAuthUserCreateInput,
  counter: RegisteredUserCounter,
) {
  if (await counter.hasRegisteredUsers()) {
    throw new APIError("FORBIDDEN", {
      message: "Owner user already exists",
    });
  }

  return {
    data: {
      ...user,
      role: "owner",
    },
  };
}

export async function hasRegisteredUsers(db: VaneSqliteKysely): Promise<boolean> {
  const row = await db
    .selectFrom("user")
    .select((eb) => eb.fn.countAll<number>().as("count"))
    .executeTakeFirst();

  return (row?.count ?? 0) > 0;
}
