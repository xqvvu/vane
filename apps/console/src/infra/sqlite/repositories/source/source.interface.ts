import type { JsonObject, SourceProvider, SourceSummary } from "@vane/core";
import type { IsoDateTimeString } from "@vane/core";

import type { SqliteBoolean, SqliteJsonText } from "#/infra/sqlite/codecs.ts";

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
