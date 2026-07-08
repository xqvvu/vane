import type { DestinationKind, DestinationSummary, JsonObject } from "@vane/core";
import type { IsoDateTimeString } from "@vane/core";

import type { SqliteBoolean, SqliteJsonText } from "#/infra/sqlite/codecs.ts";

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
  list(): Promise<DestinationSummary[]>;
  listEnabled(): Promise<DestinationSummary[]>;
  get(id: string): Promise<DestinationRuntimeConfig | null>;
  create(input: CreateDestinationInput): Promise<DestinationSummary>;
  update(id: string, input: UpdateDestinationInput): Promise<DestinationSummary>;
  setEnabled(id: string, enabled: boolean): Promise<DestinationSummary>;
  delete(id: string): Promise<void>;
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
