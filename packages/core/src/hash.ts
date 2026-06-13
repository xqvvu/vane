import { mapValues, sortKeys } from "es-toolkit/object";

import type { JsonObject, JsonValue } from "#/json.ts";
import { toJsonValue } from "#/json.ts";

export function stableStringify(value: unknown): string {
  return JSON.stringify(sortJsonValue(toJsonValue(value)));
}

export function createStableHash(value: unknown): string {
  const input = stableStringify(value);
  let hash = 0x811c9dc5;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return (hash >>> 0).toString(16).padStart(8, "0");
}

function sortJsonValue(value: JsonValue): JsonValue {
  if (Array.isArray(value)) {
    return value.map(sortJsonValue);
  }

  if (typeof value === "object" && value !== null) {
    return sortKeys(mapValues(value as JsonObject, (entry) => sortJsonValue(entry))) as JsonObject;
  }

  return value;
}
