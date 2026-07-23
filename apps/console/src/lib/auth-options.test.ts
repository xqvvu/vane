import { describe, expect, it } from "vitest";

import { createBaseBetterAuthOptions } from "#/lib/auth-options";

describe("better auth options", () => {
  it("maps core auth table columns to snake_case", () => {
    const options = createBaseBetterAuthOptions();

    expect(options.user?.fields).toMatchObject({
      emailVerified: "email_verified",
      createdAt: "created_at",
      updatedAt: "updated_at",
    });
    expect(options.session?.fields).toMatchObject({
      expiresAt: "expires_at",
      ipAddress: "ip_address",
      userAgent: "user_agent",
      userId: "user_id",
    });
    expect(options.account?.fields).toMatchObject({
      accountId: "account_id",
      providerId: "provider_id",
      accessTokenExpiresAt: "access_token_expires_at",
      refreshTokenExpiresAt: "refresh_token_expires_at",
    });
    expect(options.verification?.fields).toMatchObject({
      expiresAt: "expires_at",
      createdAt: "created_at",
      updatedAt: "updated_at",
    });
  });
});
