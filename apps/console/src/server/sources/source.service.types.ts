import type { SourceSummary } from "@vane/core";

import type { SqliteStore } from "#/infra/sqlite/store.ts";

export interface SourceServiceOptions {
  store: SqliteStore;
  generateSourceToken?: () => string;
}

export interface CreatedSource {
  source: SourceSummary;
  token: string;
}

export interface RotatedSourceToken {
  source: SourceSummary;
  token: string;
}
