import { z } from "zod";

export type JsonPrimitive = string | number | boolean | null;
export type JsonObject = { [key: string]: JsonValue };
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];

export const JsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number().finite(),
    z.boolean(),
    z.null(),
    z.array(JsonValueSchema),
    JsonObjectSchema,
  ]),
);

export const JsonObjectSchema: z.ZodType<JsonObject> = z.record(z.string(), JsonValueSchema);

export function encodeJson(value: JsonValue): string {
  return JSON.stringify(JsonValueSchema.parse(value));
}

export function decodeJson(value: string): JsonValue {
  return JsonValueSchema.parse(JSON.parse(value));
}

export function encodeJsonObject(value: JsonObject): string {
  return JSON.stringify(JsonObjectSchema.parse(value));
}

export function decodeJsonObject(value: string): JsonObject {
  return JsonObjectSchema.parse(JSON.parse(value));
}

export function encodeSchemaJson<T>(schema: z.ZodType<T>, value: T): string {
  return JSON.stringify(schema.parse(value));
}

export function decodeSchemaJson<T>(schema: z.ZodType<T>, value: string): T {
  return schema.parse(JSON.parse(value));
}

export function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function toJsonValue(value: unknown): JsonValue {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (Array.isArray(value)) {
    return value.map(toJsonValue);
  }

  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(
          ([, entry]) =>
            entry !== undefined && typeof entry !== "function" && typeof entry !== "symbol",
        )
        .map(([key, entry]) => [key, toJsonValue(entry)]),
    );
  }

  return JSON.stringify(value);
}
