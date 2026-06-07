import {
  AlertSeveritySchema,
  AlertStatusSchema,
  NormalizedEventSchema,
  createStableHash,
  isJsonObject,
  stableStringify,
} from "@vane/core";
import type { AlertSeverity, AlertStatus, JsonObject, Labels } from "@vane/core";

import type { ProviderParseInput, ProviderParseResult, ProviderParser } from "#/types.ts";

export const genericProviderParser: ProviderParser = {
  kind: "generic",
  parse(input) {
    const payload = isJsonObject(input.payload) ? input.payload : {};
    const payloadHash = createStableHash(input.payload);
    const labels = extractLabels(payload);

    const title =
      firstString(payload, ["title", "alert", "alertname", "name", "summary"]) ?? "Generic webhook event";
    const message = firstString(payload, ["message", "description", "text", "body"]) ?? stableStringify(input.payload);
    const severity = normalizeSeverity(firstString(payload, ["severity", "level", "priority"]) ?? labels.severity);
    const status = normalizeStatus(firstString(payload, ["status", "state"]) ?? labels.status);
    const fingerprint = firstString(payload, ["fingerprint", "alertId", "alert_id"]) ?? `generic:${payloadHash}`;
    const idempotencyKey =
      firstString(payload, ["idempotencyKey", "idempotency_key", "requestId", "request_id", "eventId", "id"]) ??
      `generic:${payloadHash}`;
    const occurredAt = normalizeDate(
      firstValue(payload, ["occurredAt", "occurred_at", "startsAt", "starts_at", "time", "timestamp"]),
      input.receivedAt,
    );

    return {
      normalized: NormalizedEventSchema.parse({
        title,
        message,
        severity,
        status,
        fingerprint,
        labels,
        occurredAt,
      }),
      providerMetadata: {
        provider: "generic",
        parserVersion: 1,
        payloadHash,
        payloadKeys: Object.keys(payload),
      },
      idempotencyKey,
    };
  },
};

export function normalizeSeverity(value: unknown): AlertSeverity {
  const normalized = typeof value === "string" ? value.trim().toLocaleLowerCase() : "";

  if (["critical", "crit", "p0", "p1", "high", "error", "fatal"].includes(normalized)) {
    return "critical";
  }

  if (["warning", "warn", "p2", "medium"].includes(normalized)) {
    return "warning";
  }

  if (["info", "informational", "low", "notice", "ok"].includes(normalized)) {
    return "info";
  }

  return AlertSeveritySchema.parse("unknown");
}

export function normalizeStatus(value: unknown): AlertStatus {
  const normalized = typeof value === "string" ? value.trim().toLocaleLowerCase() : "";

  if (["firing", "triggered", "alerting", "open", "active", "problem"].includes(normalized)) {
    return "firing";
  }

  if (["resolved", "recovering", "recovered", "closed", "ok", "normal"].includes(normalized)) {
    return "resolved";
  }

  return AlertStatusSchema.parse("unknown");
}

function extractLabels(payload: JsonObject): Labels {
  const labels: Labels = {};
  const rawLabels = payload.labels;

  if (isJsonObject(rawLabels)) {
    for (const [key, value] of Object.entries(rawLabels)) {
      if (typeof value === "string") {
        labels[key] = value;
      } else if (typeof value === "number" || typeof value === "boolean") {
        labels[key] = String(value);
      }
    }
  }

  for (const key of ["service", "environment", "env", "cluster", "team", "severity", "status"]) {
    const value = payload[key];

    if (typeof value === "string" && labels[key] === undefined) {
      labels[key] = value;
    }
  }

  return labels;
}

function firstString(payload: JsonObject, keys: string[]): string | undefined {
  const value = firstValue(payload, keys);
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function firstValue(payload: JsonObject, keys: string[]): unknown {
  for (const key of keys) {
    if (payload[key] !== undefined) {
      return payload[key];
    }
  }

  return undefined;
}

function normalizeDate(value: unknown, fallback: string): string {
  if (typeof value === "number") {
    const milliseconds = value < 1_000_000_000_000 ? value * 1000 : value;
    const date = new Date(milliseconds);

    if (!Number.isNaN(date.valueOf())) {
      return date.toISOString();
    }
  }

  if (typeof value === "string") {
    const date = new Date(value);

    if (!Number.isNaN(date.valueOf())) {
      return date.toISOString();
    }
  }

  return new Date(fallback).toISOString();
}

export function parseGenericProvider(input: ProviderParseInput): ProviderParseResult {
  return genericProviderParser.parse(input);
}
