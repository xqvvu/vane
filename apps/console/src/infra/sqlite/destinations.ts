import "@tanstack/react-start/server-only";
import { decodeJsonObject, DestinationKindSchema, encodeJsonObject } from "@vane/core";
import type { DestinationKind, DestinationSummary, JsonObject } from "@vane/core";

import {
  fromSqliteBoolean,
  rowOrUndefined,
  rowsAs,
  toSqliteBoolean,
  type SqliteBoolean,
  type SqliteJsonText,
} from "#/infra/sqlite/codecs.ts";
import type { SqliteRepositoryContext } from "#/infra/sqlite/context.ts";
import { RecordNotFoundError } from "#/infra/sqlite/errors.ts";
import type { IsoDateTimeString } from "#/infra/sqlite/types.ts";

export interface DestinationRow {
  id: string;
  name: string;
  kind: string;
  enabled: SqliteBoolean;
  config_json: SqliteJsonText;
  secret_refs_json: SqliteJsonText;
  created_at: IsoDateTimeString;
  updated_at: IsoDateTimeString;
}

export interface DestinationRepository {
  list(): DestinationSummary[];
  listEnabled(): DestinationSummary[];
  get(id: string): DestinationRuntimeConfig | null;
  create(input: CreateDestinationInput): DestinationSummary;
  update(id: string, input: UpdateDestinationInput): DestinationSummary;
  setEnabled(id: string, enabled: boolean): DestinationSummary;
}

export interface DestinationRuntimeConfig extends DestinationSummary {
  config: JsonObject;
  secretRefs: JsonObject;
}

export interface CreateDestinationInput {
  id?: string;
  name: string;
  kind: DestinationKind;
  enabled?: boolean;
  config?: JsonObject;
  secretRefs?: JsonObject;
  createdAt?: IsoDateTimeString;
  updatedAt?: IsoDateTimeString;
}

export interface UpdateDestinationInput {
  name?: string;
  kind?: DestinationKind;
  enabled?: boolean;
  config?: JsonObject;
  secretRefs?: JsonObject;
  updatedAt?: IsoDateTimeString;
}

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

export class SqliteDestinationRepository implements DestinationRepository {
  constructor(private readonly context: SqliteRepositoryContext) {}

  list(): DestinationSummary[] {
    return rowsAs<DestinationRow>(
      this.context.db.prepare("SELECT * FROM destinations ORDER BY name").all(),
    ).map((row) => destinationSummaryFromRow(row));
  }

  listEnabled(): DestinationSummary[] {
    return rowsAs<DestinationRow>(
      this.context.db.prepare("SELECT * FROM destinations WHERE enabled = 1 ORDER BY name").all(),
    ).map((row) => destinationSummaryFromRow(row));
  }

  get(id: string): DestinationRuntimeConfig | null {
    const row = rowOrUndefined<DestinationRow>(
      this.context.db.prepare("SELECT * FROM destinations WHERE id = ?").get(id),
    );
    return row ? destinationRuntimeFromRow(row) : null;
  }

  create(input: CreateDestinationInput): DestinationSummary {
    const now = this.context.now();
    const id = input.id ?? this.context.ids.destination();
    const createdAt = input.createdAt ?? now;
    const updatedAt = input.updatedAt ?? createdAt;

    this.context.db
      .prepare(
        `
          INSERT INTO destinations (id, name, kind, enabled, config_json, secret_refs_json, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
      )
      .run(
        id,
        input.name,
        input.kind,
        toSqliteBoolean(input.enabled ?? true),
        encodeJsonObject(input.config ?? {}),
        encodeJsonObject(input.secretRefs ?? {}),
        createdAt,
        updatedAt,
      );

    return destinationSummaryFromRuntime(requireDestination(this.get(id)));
  }

  update(id: string, input: UpdateDestinationInput): DestinationSummary {
    const current = requireDestination(this.get(id));
    const updatedAt = input.updatedAt ?? this.context.now();

    this.context.db
      .prepare(
        `
          UPDATE destinations
          SET name = ?, kind = ?, enabled = ?, config_json = ?, secret_refs_json = ?, updated_at = ?
          WHERE id = ?
        `,
      )
      .run(
        input.name ?? current.name,
        input.kind ?? current.kind,
        toSqliteBoolean(input.enabled ?? current.enabled),
        encodeJsonObject(input.config ?? current.config),
        encodeJsonObject(input.secretRefs ?? current.secretRefs),
        updatedAt,
        id,
      );

    return destinationSummaryFromRuntime(requireDestination(this.get(id)));
  }

  setEnabled(id: string, enabled: boolean): DestinationSummary {
    return this.update(id, { enabled });
  }
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
