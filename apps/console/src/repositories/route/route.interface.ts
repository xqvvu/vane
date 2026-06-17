import type { RouteDefinition, RouteDefinitionInput } from "@vane/core";

import type { SqliteBoolean, SqliteJsonText } from "#/infra/sqlite/codecs.ts";
import type { IsoDateTimeString } from "#/infra/sqlite/types.ts";

export interface RouteRow {
  id: string;
  name: string;
  enabled: SqliteBoolean;
  rule_json: SqliteJsonText;
  destination_ids_json: SqliteJsonText;
  created_at: IsoDateTimeString;
  updated_at: IsoDateTimeString;
}

export interface RouteRepository {
  list(): RouteDefinition[];
  listEnabled(): RouteDefinition[];
  get(id: string): RouteDefinition | null;
  create(input: CreateRouteInput): RouteDefinition;
  update(id: string, input: UpdateRouteInput): RouteDefinition;
  setEnabled(id: string, enabled: boolean): RouteDefinition;
}

export interface CreateRouteInput {
  id?: string;
  name: string;
  enabled?: boolean;
  rule?: RouteDefinitionInput["rule"];
  destinationIds: string[];
  createdAt?: IsoDateTimeString;
  updatedAt?: IsoDateTimeString;
}

export interface UpdateRouteInput {
  name?: string;
  enabled?: boolean;
  rule?: RouteDefinitionInput["rule"];
  destinationIds?: string[];
  updatedAt?: IsoDateTimeString;
}
