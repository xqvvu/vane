import { APIError } from "better-auth/api";
import { describe, expect, it } from "vitest";

import { assignOwnerRoleBeforeUserCreate } from "#/lib/auth-owner-bootstrap.ts";

const user = {
  id: "user-1",
  name: "Vane Owner",
  email: "owner@example.test",
};

describe("auth owner bootstrap", () => {
  it("assigns the first registered user the owner role", async () => {
    await expect(
      assignOwnerRoleBeforeUserCreate(user, {
        hasRegisteredUsers: () => false,
      }),
    ).resolves.toEqual({
      data: {
        ...user,
        role: "owner",
      },
    });
  });

  it("rejects later dashboard self-registration attempts", async () => {
    await expect(
      assignOwnerRoleBeforeUserCreate(user, {
        hasRegisteredUsers: () => true,
      }),
    ).rejects.toMatchObject({
      message: "Owner user already exists",
    });

    await expect(
      assignOwnerRoleBeforeUserCreate(user, {
        hasRegisteredUsers: () => true,
      }),
    ).rejects.toBeInstanceOf(APIError);
  });
});
