import "@tanstack/react-start/server-only";
import { randomBytes } from "node:crypto";

import { JsonObjectSchema, redactText } from "@vane/core";
import type { DestinationKind, JsonObject, JsonValue, NormalizedEvent } from "@vane/core";
import type { DestinationRegistry } from "@vane/destinations";

import type { SqliteStore } from "#/infra/sqlite/store.ts";

export function generateSourceToken(): string {
  return `vane_src_${randomBytes(24).toString("base64url")}`;
}

export function createTestNormalizedEvent(): NormalizedEvent {
  return {
    title: "Vane destination test",
    message: "This is a test alert generated from Vane Console.",
    severity: "info",
    status: "firing",
    fingerprint: "vane:test-destination",
    labels: {
      source: "vane",
      test: "true",
    },
    occurredAt: new Date().toISOString(),
  };
}

export function redactNullableText(value: string | null): string | null {
  return value === null ? null : redactText(value);
}

export function parseDestinationConfig(
  destinations: DestinationRegistry,
  kind: DestinationKind,
  config: JsonObject,
): JsonObject {
  return JsonObjectSchema.parse(destinations.parse(kind, config));
}

export async function requireExistingSourceIds(
  sourceIds: string[],
  sources: Pick<SqliteStore["sources"], "get">,
): Promise<void> {
  const missing: string[] = [];

  for (const id of new Set(sourceIds)) {
    if ((await sources.get(id)) === null) {
      missing.push(id);
    }
  }

  if (missing.length > 0) {
    throw new Error(`Unknown source IDs: ${missing.join(", ")}`);
  }
}

export async function requireExistingDestinationIds(
  destinationIds: string[],
  destinations: Pick<SqliteStore["destinations"], "get">,
): Promise<void> {
  const missing: string[] = [];

  for (const id of new Set(destinationIds)) {
    if ((await destinations.get(id)) === null) {
      missing.push(id);
    }
  }

  if (missing.length > 0) {
    throw new Error(`Unknown destination IDs: ${missing.join(", ")}`);
  }
}

export function mergeJsonObjects(base: JsonObject, patch: JsonObject): JsonObject {
  const output: JsonObject = { ...base };

  for (const [key, value] of Object.entries(patch)) {
    const existing = output[key];

    output[key] =
      isPlainJsonObject(existing) && isPlainJsonObject(value)
        ? mergeJsonObjects(existing, value)
        : value;
  }

  return output;
}

function isPlainJsonObject(value: JsonValue | undefined): value is JsonObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
