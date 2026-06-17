import { NormalizedEventSchema, createStableHash, isJsonObject, stableStringify } from "@vane/core";
import type { JsonObject, Labels } from "@vane/core";

import { normalizeSeverity, normalizeStatus } from "#/shared/normalization.ts";
import {
  firstScalarString,
  firstString,
  firstValue,
  normalizeDate,
  objectValue,
  setOptionalLabel,
} from "#/shared/object.ts";
import {
  completeProviderParseInput,
  providerParseSucceeded,
  type ProviderParseInput,
  type ProviderParseOutput,
  type ProviderParseResult,
  type ProviderStandaloneParseInput,
  unwrapProviderParseResult,
} from "#/types.ts";

import type { UptimeKumaProviderConfig } from "./schema.ts";

export function parseUptimeKumaProviderResult(
  input: ProviderParseInput<UptimeKumaProviderConfig>,
): ProviderParseResult {
  if (!isJsonObject(input.payload)) {
    throw new Error("Expected uptime_kuma webhook payload object");
  }

  const payload = input.payload;
  const payloadHash = createStableHash(input.payload);
  const monitor = objectValue(payload.monitor);
  const heartbeat = objectValue(payload.heartbeat) ?? objectValue(payload.heartbeatJSON);
  const monitorName =
    firstString(monitor, ["name", "friendly_name"]) ?? firstString(payload, ["monitorName"]);
  const monitorUrl = firstString(monitor, ["url", "hostname"]) ?? firstString(payload, ["url"]);
  const statusValue =
    firstValue(heartbeat, ["status"]) ?? firstValue(payload, ["status", "monitorStatus"]);
  const status = normalizeUptimeKumaStatus(statusValue);
  const message =
    firstString(payload, ["msg", "message"]) ??
    firstString(heartbeat, ["msg", "message"]) ??
    stableStringify(input.payload);
  const title =
    firstString(payload, ["title"]) ??
    (monitorName ? `${monitorName} is ${status}` : "Uptime Kuma notification");
  const labels = extractLabels(payload, monitor);
  const occurredAt = normalizeDate(
    firstValue(heartbeat, ["time", "localDateTime", "created_date"]) ??
      firstValue(payload, ["time", "timestamp"]),
    input.receivedAt,
  );
  const fingerprint =
    firstScalarString(monitor, ["id"]) ??
    firstScalarString(payload, ["monitorID", "monitorId"]) ??
    monitorName ??
    monitorUrl ??
    `uptime_kuma:${payloadHash}`;

  return providerParseSucceeded({
    normalized: NormalizedEventSchema.parse({
      title,
      message,
      severity: status === "firing" ? normalizeSeverity("critical") : normalizeSeverity("info"),
      status,
      fingerprint: `uptime_kuma:${fingerprint}`,
      labels,
      occurredAt,
    }),
    providerMetadata: {
      provider: "uptime_kuma",
      parserVersion: 1,
      payloadHash,
      payloadKeys: Object.keys(payload),
    },
    idempotencyKey: `uptime_kuma:${payloadHash}`,
  });
}

export function parseUptimeKumaProvider(
  input: ProviderStandaloneParseInput<UptimeKumaProviderConfig>,
): ProviderParseOutput {
  return unwrapProviderParseResult(
    parseUptimeKumaProviderResult(
      completeProviderParseInput("uptime_kuma", input, input.config ?? {}),
    ),
  );
}

function extractLabels(payload: JsonObject, monitor: JsonObject | undefined): Labels {
  const labels: Labels = {
    provider: "uptime_kuma",
  };

  setOptionalLabel(labels, "monitor", firstString(monitor, ["name", "friendly_name"]));
  setOptionalLabel(labels, "url", firstString(monitor, ["url", "hostname"]));
  setOptionalLabel(labels, "type", firstString(monitor, ["type"]));
  setOptionalLabel(labels, "tag", firstString(payload, ["tag"]));

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

  return labels;
}

function normalizeUptimeKumaStatus(value: unknown): "firing" | "resolved" | "unknown" {
  if (typeof value === "number") {
    return value === 1 ? "resolved" : "firing";
  }

  return normalizeStatus(value);
}
