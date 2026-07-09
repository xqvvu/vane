import { encodeJsonObject } from "@vane/core";
import type { DestinationSummary } from "@vane/core";

import { toSqliteBoolean } from "#/infra/sqlite/codecs.ts";
import type { SqliteRepositoryContext } from "#/infra/sqlite/context.ts";
import {
  destinationRuntimeFromRow,
  destinationSummaryFromRow,
  destinationSummaryFromRuntime,
  requireDestination,
} from "#/infra/sqlite/repositories/destination/destination.helpers.ts";
import type {
  CreateDestinationInput,
  DestinationRepository,
  DestinationRuntimeConfig,
  UpdateDestinationInput,
} from "#/infra/sqlite/repositories/destination/destination.interface.ts";

export class SqliteDestinationRepository implements DestinationRepository {
  constructor(private readonly context: SqliteRepositoryContext) {}

  async list(): Promise<DestinationSummary[]> {
    const rows = await this.context.db
      .selectFrom("destinations")
      .selectAll()
      .orderBy("created_at", "desc")
      .orderBy("id", "desc")
      .execute();

    return rows.map((row) => destinationSummaryFromRow(row));
  }

  async listEnabled(): Promise<DestinationSummary[]> {
    const rows = await this.context.db
      .selectFrom("destinations")
      .selectAll()
      .where("enabled", "=", 1)
      .orderBy("created_at", "desc")
      .orderBy("id", "desc")
      .execute();

    return rows.map((row) => destinationSummaryFromRow(row));
  }

  async get(id: string): Promise<DestinationRuntimeConfig | null> {
    const row = await this.context.db
      .selectFrom("destinations")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();

    return row ? destinationRuntimeFromRow(row) : null;
  }

  async create(input: CreateDestinationInput): Promise<DestinationSummary> {
    const now = this.context.now();
    const id = input.id ?? this.context.ids.destination();
    const createdAt = input.createdAt ?? now;
    const updatedAt = input.updatedAt ?? createdAt;

    await this.context.db
      .insertInto("destinations")
      .values({
        id,
        name: input.name,
        kind: input.kind,
        enabled: toSqliteBoolean(input.enabled ?? true),
        config_json: encodeJsonObject(input.config ?? {}),
        secret_refs_json: encodeJsonObject(input.secretRefs ?? {}),
        created_at: createdAt,
        updated_at: updatedAt,
      })
      .execute();

    return destinationSummaryFromRuntime(requireDestination(await this.get(id)));
  }

  async update(id: string, input: UpdateDestinationInput): Promise<DestinationSummary> {
    const current = requireDestination(await this.get(id));
    const updatedAt = input.updatedAt ?? this.context.now();

    await this.context.db
      .updateTable("destinations")
      .set({
        name: input.name ?? current.name,
        kind: input.kind ?? current.kind,
        enabled: toSqliteBoolean(input.enabled ?? current.enabled),
        config_json: encodeJsonObject(input.config ?? current.config),
        secret_refs_json: encodeJsonObject(input.secretRefs ?? current.secretRefs),
        updated_at: updatedAt,
      })
      .where("id", "=", id)
      .execute();

    return destinationSummaryFromRuntime(requireDestination(await this.get(id)));
  }

  setEnabled(id: string, enabled: boolean): Promise<DestinationSummary> {
    return this.update(id, { enabled });
  }

  async delete(id: string): Promise<void> {
    requireDestination(await this.get(id));

    await this.context.db.deleteFrom("destinations").where("id", "=", id).execute();
  }
}
