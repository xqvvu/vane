import "@tanstack/react-start/server-only";
import { randomUUID } from "node:crypto";

import { decodeJsonObject, encodeJsonObject, SourceProviderSchema } from "@vane/core";
import type { JsonObject, SourceProvider, SourceSummary } from "@vane/core";

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

export interface SourceRow {
  id: string;
  name: string;
  provider: string;
  token_hash: string;
  enabled: SqliteBoolean;
  config_json: SqliteJsonText;
  created_at: IsoDateTimeString;
  updated_at: IsoDateTimeString;
}

export interface SourceRepository {
  list(): SourceSummary[];
  listEnabled(): SourceSummary[];
  get(id: string): SourceRuntimeConfig | null;
  findByTokenHash(tokenHash: string): SourceRuntimeConfig | null;
  create(input: CreateSourceInput): SourceSummary;
  update(id: string, input: UpdateSourceInput): SourceSummary;
  setEnabled(id: string, enabled: boolean): SourceSummary;
}

export interface SourceRuntimeConfig extends SourceSummary {
  tokenHash: string;
  config: JsonObject;
}

export interface CreateSourceInput {
  id?: string;
  name: string;
  provider: SourceProvider;
  tokenHash: string;
  enabled?: boolean;
  config?: JsonObject;
  createdAt?: IsoDateTimeString;
  updatedAt?: IsoDateTimeString;
}

export interface UpdateSourceInput {
  name?: string;
  provider?: SourceProvider;
  tokenHash?: string;
  enabled?: boolean;
  config?: JsonObject;
  updatedAt?: IsoDateTimeString;
}

export function sourceSummaryFromRow(row: SourceRow): SourceSummary {
  return {
    id: row.id,
    name: row.name,
    provider: SourceProviderSchema.parse(row.provider),
    enabled: fromSqliteBoolean(row.enabled),
  };
}

export function sourceRuntimeFromRow(row: SourceRow): SourceRuntimeConfig {
  return {
    ...sourceSummaryFromRow(row),
    tokenHash: row.token_hash,
    config: decodeJsonObject(row.config_json),
  };
}

export function sourceSummaryFromRuntime(source: SourceRuntimeConfig): SourceSummary {
  return {
    id: source.id,
    name: source.name,
    provider: source.provider,
    enabled: source.enabled,
  };
}

export function requireSource(source: SourceRuntimeConfig | null): SourceRuntimeConfig {
  if (!source) {
    throw new RecordNotFoundError("Source");
  }

  return source;
}

export class SqliteSourceRepository implements SourceRepository {
  constructor(private readonly context: SqliteRepositoryContext) {}

  list(): SourceSummary[] {
    return rowsAs<SourceRow>(
      this.context.db.prepare("SELECT * FROM sources ORDER BY name").all(),
    ).map((row) => sourceSummaryFromRow(row));
  }

  listEnabled(): SourceSummary[] {
    return rowsAs<SourceRow>(
      this.context.db.prepare("SELECT * FROM sources WHERE enabled = 1 ORDER BY name").all(),
    ).map((row) => sourceSummaryFromRow(row));
  }

  get(id: string): SourceRuntimeConfig | null {
    const row = rowOrUndefined<SourceRow>(
      this.context.db.prepare("SELECT * FROM sources WHERE id = ?").get(id),
    );
    return row ? sourceRuntimeFromRow(row) : null;
  }

  findByTokenHash(tokenHash: string): SourceRuntimeConfig | null {
    const row = rowOrUndefined<SourceRow>(
      this.context.db.prepare("SELECT * FROM sources WHERE token_hash = ?").get(tokenHash),
    );
    return row ? sourceRuntimeFromRow(row) : null;
  }

  create(input: CreateSourceInput): SourceSummary {
    const now = this.context.now();
    const id = input.id ?? randomUUID();
    const createdAt = input.createdAt ?? now;
    const updatedAt = input.updatedAt ?? createdAt;

    this.context.db
      .prepare(
        `
          INSERT INTO sources (id, name, provider, token_hash, enabled, config_json, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
      )
      .run(
        id,
        input.name,
        input.provider,
        input.tokenHash,
        toSqliteBoolean(input.enabled ?? true),
        encodeJsonObject(input.config ?? {}),
        createdAt,
        updatedAt,
      );

    return requireSource(this.get(id));
  }

  update(id: string, input: UpdateSourceInput): SourceSummary {
    const current = requireSource(this.get(id));
    const updatedAt = input.updatedAt ?? this.context.now();

    this.context.db
      .prepare(
        `
          UPDATE sources
          SET name = ?, provider = ?, token_hash = ?, enabled = ?, config_json = ?, updated_at = ?
          WHERE id = ?
        `,
      )
      .run(
        input.name ?? current.name,
        input.provider ?? current.provider,
        input.tokenHash ?? current.tokenHash,
        toSqliteBoolean(input.enabled ?? current.enabled),
        encodeJsonObject(input.config ?? current.config),
        updatedAt,
        id,
      );

    return sourceSummaryFromRuntime(requireSource(this.get(id)));
  }

  setEnabled(id: string, enabled: boolean): SourceSummary {
    return this.update(id, { enabled });
  }
}
