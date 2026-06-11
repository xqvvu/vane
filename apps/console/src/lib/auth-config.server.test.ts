import { describe, expect, it } from "vitest";

import { requireBetterAuthBaseUrl, requireBetterAuthSecret } from "#/lib/auth-config.server.ts";

describe("auth runtime config", () => {
  it("allows local development to rely on Better Auth defaults", () => {
    expect(requireBetterAuthBaseUrl(undefined, { NODE_ENV: "development" })).toBeUndefined();
    expect(requireBetterAuthSecret(undefined, { NODE_ENV: "development" })).toBeUndefined();
  });

  it("requires an explicit base URL and deployment-specific secret in production", () => {
    expect(() => requireBetterAuthBaseUrl(undefined, { NODE_ENV: "production" })).toThrow(
      "BETTER_AUTH_URL or SERVER_URL is required in production",
    );
    expect(() => requireBetterAuthSecret(undefined, { NODE_ENV: "production" })).toThrow(
      "BETTER_AUTH_SECRET is required in production",
    );
    expect(() => requireBetterAuthSecret("short", { NODE_ENV: "production" })).toThrow(
      "BETTER_AUTH_SECRET must be at least 32 characters in production",
    );
    expect(() =>
      requireBetterAuthSecret("change-me-to-at-least-32-characters", {
        NODE_ENV: "production",
      }),
    ).toThrow("BETTER_AUTH_SECRET must be replaced with a deployment-specific secret");
    expect(() =>
      requireBetterAuthSecret("better-auth-secret-12345678901234567890", {
        NODE_ENV: "production",
      }),
    ).toThrow("BETTER_AUTH_SECRET must be replaced with a deployment-specific secret");

    expect(requireBetterAuthBaseUrl("https://vane.example.test", { NODE_ENV: "production" })).toBe(
      "https://vane.example.test",
    );
    expect(
      requireBetterAuthSecret("0123456789abcdef0123456789abcdef", {
        NODE_ENV: "production",
      }),
    ).toBe("0123456789abcdef0123456789abcdef");
  });
});
