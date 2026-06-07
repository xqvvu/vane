import type { JsonObject, JsonValue } from "#/json.ts";

const SENSITIVE_KEY_PATTERN =
  /^(authorization|cookie|set-cookie|x-api-key|api-key|apikey|token|access-token|refresh-token|secret|password|passwd|webhook_url|webhook-url|signing_secret|signing-secret)$/i;

export const REDACTED_VALUE = "[REDACTED]";

export function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY_PATTERN.test(key);
}

export function redactHeaders(headers: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key, isSensitiveKey(key) ? REDACTED_VALUE : value]),
  );
}

export function redactJsonValue(value: JsonValue): JsonValue {
  if (Array.isArray(value)) {
    return value.map(redactJsonValue);
  }

  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(
      Object.entries(value as JsonObject).map(([key, entry]) => [
        key,
        isSensitiveKey(key) ? REDACTED_VALUE : redactJsonValue(entry),
      ]),
    );
  }

  return value;
}
