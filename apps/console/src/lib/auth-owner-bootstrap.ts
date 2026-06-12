import "@tanstack/react-start/server-only";
import { APIError } from "better-auth/api";

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
  hasRegisteredUsers(): boolean;
}

export async function assignOwnerRoleBeforeUserCreate(
  user: BetterAuthUserCreateInput,
  counter: RegisteredUserCounter,
) {
  if (counter.hasRegisteredUsers()) {
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
