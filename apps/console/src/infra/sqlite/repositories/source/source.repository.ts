import { encodeJsonObject } from "@vane/core";
import type { SourceSummary } from "@vane/core";

import { rowOrUndefined, rowsAs, toSqliteBoolean } from "#/infra/sqlite/codecs.ts";
import type { SqliteRepositoryContext } from "#/infra/sqlite/context.ts";
import {
  requireSource,
  sourceRuntimeFromRow,
  sourceSummaryFromRow,
  sourceSummaryFromRuntime,
} from "#/infra/sqlite/repositories/source/source.helpers.ts";
import type {
  CreateSourceInput,
  SourceRepository,
  SourceRow,
  SourceRuntimeConfig,
  UpdateSourceInput,
} from "#/infra/sqlite/repositories/source/source.interface.ts";

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
    const id = input.id ?? this.context.ids.source();
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
