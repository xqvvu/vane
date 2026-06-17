import { encodeJsonObject } from "@vane/core";
import type { DestinationSummary } from "@vane/core";

import { rowOrUndefined, rowsAs, toSqliteBoolean } from "#/infra/sqlite/codecs.ts";
import type { SqliteRepositoryContext } from "#/infra/sqlite/context.ts";
import {
  destinationRuntimeFromRow,
  destinationSummaryFromRow,
  destinationSummaryFromRuntime,
  requireDestination,
} from "#/repositories/destination/destination.helpers.ts";
import type {
  CreateDestinationInput,
  DestinationRepository,
  DestinationRow,
  DestinationRuntimeConfig,
  UpdateDestinationInput,
} from "#/repositories/destination/destination.interface.ts";

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
