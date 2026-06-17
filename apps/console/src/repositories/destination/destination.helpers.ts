import { decodeJsonObject, DestinationKindSchema } from "@vane/core";
import type { DestinationSummary, JsonObject } from "@vane/core";

import { fromSqliteBoolean } from "#/infra/sqlite/codecs.ts";
import { RecordNotFoundError } from "#/infra/sqlite/errors.ts";
import type {
  DestinationRow,
  DestinationRuntimeConfig,
} from "#/repositories/destination/destination.interface.ts";

export function destinationSummaryFromRow(row: DestinationRow): DestinationSummary {
  return {
    id: row.id,
    name: row.name,
    kind: DestinationKindSchema.parse(row.kind),
    enabled: fromSqliteBoolean(row.enabled),
  };
}

export function destinationRuntimeFromRow(row: DestinationRow): DestinationRuntimeConfig {
  return {
    ...destinationSummaryFromRow(row),
    config: decodeJsonObject(row.config_json),
    secretRefs: decodeJsonObject(row.secret_refs_json),
  };
}

export function destinationSummaryFromRuntime(
  destination: DestinationRuntimeConfig,
): DestinationSummary {
  return {
    id: destination.id,
    name: destination.name,
    kind: destination.kind,
    enabled: destination.enabled,
  };
}

export function destinationMetadataFromRuntime(destination: DestinationRuntimeConfig): JsonObject {
  const config = destination.config;
  const metadata: JsonObject = {
    messageTemplateConfigured: hasConfiguredString(config, "messageTemplate"),
  };

  if (destination.kind === "generic_webhook") {
    metadata.method = configString(config, "method") ?? "POST";
    addHeaderNames(metadata, config);
    return metadata;
  }

  if (destination.kind === "feishu") {
    metadata.signingEnabled = hasConfiguredString(config, "signSecret");
    return metadata;
  }

  if (destination.kind === "email") {
    const to = configStringArray(config, "to");
    const from = configString(config, "from");
    const replyTo = configString(config, "replyTo");
    const subjectPrefix = configString(config, "subjectPrefix");

    if (to.length > 0) {
      metadata.to = to;
    }

    if (from) {
      metadata.from = from;
    }

    if (replyTo) {
      metadata.replyTo = replyTo;
    }

    if (subjectPrefix) {
      metadata.subjectPrefix = subjectPrefix;
    }

    addHeaderNames(metadata, config);
  }

  return metadata;
}

export function requireDestination(
  destination: DestinationRuntimeConfig | null,
): DestinationRuntimeConfig {
  if (!destination) {
    throw new RecordNotFoundError("Destination");
  }

  return destination;
}

function hasConfiguredString(config: JsonObject, key: string): boolean {
  return Boolean(configString(config, key));
}

function configString(config: JsonObject, key: string): string | null {
  const value = config[key];

  return typeof value === "string" && value.trim() ? value : null;
}

function configStringArray(config: JsonObject, key: string): string[] {
  const value = config[key];

  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is string => typeof entry === "string" && entry.length > 0);
}

function addHeaderNames(metadata: JsonObject, config: JsonObject): void {
  const headers = config.headers;

  if (!headers || typeof headers !== "object" || Array.isArray(headers)) {
    return;
  }

  const headerNames = Object.keys(headers).sort();

  if (headerNames.length > 0) {
    metadata.headerNames = headerNames;
  }
}
