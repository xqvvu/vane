import { NormalizedEventSchema, createStableHash, isJsonObject, stableStringify } from "@vane/core";
import type { JsonObject, Labels } from "@vane/core";

import { normalizeSeverity, normalizeStatus } from "#/generic.ts";
import type { ProviderParseInput, ProviderParseResult, ProviderParser } from "#/types.ts";

export const grafanaProviderParser: ProviderParser = {
  kind: "grafana",
  parse(input) {
    if (!isJsonObject(input.payload)) {
      throw new Error("Expected grafana webhook payload object");
    }

    const payload = input.payload;
    const payloadHash = createStableHash(input.payload);
    const alerts = extractAlerts(payload);
    const firstAlert = alerts[0];
    const labels = extractLabels(payload, firstAlert);
    const commonAnnotations = objectValue(payload.commonAnnotations);
    const alertAnnotations = objectValue(firstAlert?.annotations);
    const title =
      firstString(payload, ["title"]) ??
      firstString(commonAnnotations, ["summary"]) ??
      firstString(alertAnnotations, ["summary"]) ??
      labels.alertname ??
      "Grafana alert";
    const message =
      firstString(payload, ["message"]) ??
      firstString(alertAnnotations, ["description", "summary"]) ??
      firstString(commonAnnotations, ["description", "summary"]) ??
      stableStringify(input.payload);
    const occurredAt = normalizeGrafanaDate(
      firstAlert?.status === "resolved"
        ? firstValue(firstAlert, ["endsAt", "ends_at"])
        : firstValue(firstAlert, ["startsAt", "starts_at"]),
      input.receivedAt,
    );

    const providerMetadata: JsonObject = {
      provider: "grafana",
      parserVersion: 1,
      payloadHash,
      alertCount: alerts.length,
    };
    setOptionalString(providerMetadata, "receiver", firstString(payload, ["receiver"]));
    setOptionalString(
      providerMetadata,
      "groupKey",
      firstString(payload, ["groupKey", "group_key"]),
    );
    setOptionalString(
      providerMetadata,
      "externalURL",
      firstString(payload, ["externalURL", "external_url"]),
    );

    return {
      normalized: NormalizedEventSchema.parse({
        title,
        message,
        severity: normalizeSeverity(labels.severity),
        status: normalizeStatus(
          firstString(payload, ["status"]) ?? firstString(firstAlert, ["status"]),
        ),
        fingerprint:
          firstString(firstAlert, ["fingerprint"]) ??
          firstString(payload, ["groupKey", "group_key"]) ??
          `grafana:${payloadHash}`,
        labels,
        occurredAt,
      }),
      providerMetadata,
      idempotencyKey: `grafana:${payloadHash}`,
    };
  },
};

export function parseGrafanaProvider(input: ProviderParseInput): ProviderParseResult {
  return grafanaProviderParser.parse(input);
}

function extractAlerts(payload: JsonObject): JsonObject[] {
  const alerts = payload.alerts;
  return Array.isArray(alerts) ? alerts.filter(isJsonObject) : [];
}

function extractLabels(payload: JsonObject, firstAlert: JsonObject | undefined): Labels {
  return {
    ...labelsFromObject(objectValue(payload.commonLabels)),
    ...labelsFromObject(objectValue(firstAlert?.labels)),
  };
}

function labelsFromObject(value: JsonObject | undefined): Labels {
  const labels: Labels = {};

  if (!value) {
    return labels;
  }

  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === "string") {
      labels[key] = entry;
    } else if (typeof entry === "number" || typeof entry === "boolean") {
      labels[key] = String(entry);
    }
  }

  return labels;
}

function objectValue(value: unknown): JsonObject | undefined {
  return isJsonObject(value) ? value : undefined;
}

function firstString(payload: JsonObject | undefined, keys: string[]): string | undefined {
  const value = firstValue(payload, keys);
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function firstValue(payload: JsonObject | undefined, keys: string[]): unknown {
  if (!payload) {
    return undefined;
  }

  for (const key of keys) {
    if (payload[key] !== undefined) {
      return payload[key];
    }
  }

  return undefined;
}

function normalizeGrafanaDate(value: unknown, fallback: string): string {
  if (typeof value === "string") {
    const date = new Date(value);

    if (!Number.isNaN(date.valueOf())) {
      return date.toISOString();
    }
  }

  return new Date(fallback).toISOString();
}

function setOptionalString(metadata: JsonObject, key: string, value: string | undefined): void {
  if (value !== undefined) {
    metadata[key] = value;
  }
}
