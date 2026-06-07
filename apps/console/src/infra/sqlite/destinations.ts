import "@tanstack/react-start/server-only";
import { randomUUID } from "node:crypto";

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
    const id = input.id ?? randomUUID();
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
