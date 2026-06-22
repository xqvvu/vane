import "@tanstack/react-start/server-only";

const BETTER_AUTH_DEFAULT_SECRET = "better-auth-secret-12345678901234567890";
const DOCUMENTED_PLACEHOLDER_SECRET = "change-me-to-at-least-32-characters";

export interface AuthRuntimeEnvironment {
  NODE_ENV?: string;
}

export type BetterAuthBaseUrl =
  | string
  | {
      allowedHosts: string[];
      fallback?: string | undefined;
      protocol: "auto";
    };

export interface BetterAuthBaseUrlOptions {
  allowedHosts?: string[] | undefined;
}

export function requireBetterAuthBaseUrl(
  baseUrl: string | undefined,
  environment: AuthRuntimeEnvironment = process.env,
  options: BetterAuthBaseUrlOptions = {},
): BetterAuthBaseUrl | undefined {
  const allowedHosts = options.allowedHosts ?? [];
  const trimmed = baseUrl?.trim();

  if (allowedHosts.length > 0) {
    return {
      allowedHosts,
      fallback: trimmed || undefined,
      protocol: "auto",
    };
  }

  if (trimmed) {
    return trimmed;
  }

  if (isProduction(environment)) {
    throw new Error("BETTER_AUTH_URL or SERVER_URL is required in production");
  }

  return undefined;
}

export function requireBetterAuthSecret(
  secret: string | undefined,
  environment: AuthRuntimeEnvironment = process.env,
): string | undefined {
  const trimmed = secret?.trim();

  if (!isProduction(environment)) {
    return trimmed || undefined;
  }

  if (!trimmed) {
    throw new Error("BETTER_AUTH_SECRET is required in production");
  }

  if (trimmed.length < 32) {
    throw new Error("BETTER_AUTH_SECRET must be at least 32 characters in production");
  }

  if (isPlaceholderSecret(trimmed)) {
    throw new Error("BETTER_AUTH_SECRET must be replaced with a deployment-specific secret");
  }

  return trimmed;
}

function isProduction(environment: AuthRuntimeEnvironment): boolean {
  return environment.NODE_ENV === "production";
}

function isPlaceholderSecret(secret: string): boolean {
  return secret === BETTER_AUTH_DEFAULT_SECRET || secret === DOCUMENTED_PLACEHOLDER_SECRET;
}
