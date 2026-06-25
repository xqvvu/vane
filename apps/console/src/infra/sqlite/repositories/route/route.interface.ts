import type { RouteDefinition, RouteDefinitionInput } from "@vane/core";
import type { IsoDateTimeString } from "@vane/core";

import type { SqliteBoolean, SqliteJsonText } from "#/infra/sqlite/codecs.ts";

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
  list(): Promise<RouteDefinition[]>;
  listEnabled(): Promise<RouteDefinition[]>;
  get(id: string): Promise<RouteDefinition | null>;
  create(input: CreateRouteInput): Promise<RouteDefinition>;
  update(id: string, input: UpdateRouteInput): Promise<RouteDefinition>;
  setEnabled(id: string, enabled: boolean): Promise<RouteDefinition>;
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
