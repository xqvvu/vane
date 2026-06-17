import { decodeJsonObject, SourceProviderSchema } from "@vane/core";
import type { SourceSummary } from "@vane/core";

import { fromSqliteBoolean } from "#/infra/sqlite/codecs.ts";
import { RecordNotFoundError } from "#/infra/sqlite/errors.ts";
import type { SourceRow, SourceRuntimeConfig } from "#/repositories/source/source.interface.ts";

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
