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
