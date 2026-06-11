import "@tanstack/react-start/server-only";
import {
  decodeSchemaJson,
  encodeSchemaJson,
  RouteDefinitionSchema,
  RouteRuleSchema,
} from "@vane/core";
import type { RouteDefinition, RouteDefinitionInput } from "@vane/core";

import {
  fromSqliteBoolean,
  rowOrUndefined,
  rowsAs,
  toSqliteBoolean,
  type SqliteBoolean,
  type SqliteJsonText,
} from "#/infra/sqlite/codecs.ts";
import type { SqliteRepositoryContext } from "#/infra/sqlite/context.ts";
import { RecordNotFoundError } from "#/infra/sqlite/errors.ts";
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

export function routeFromRow(row: RouteRow): RouteDefinition {
  return RouteDefinitionSchema.parse({
    id: row.id,
    name: row.name,
    enabled: fromSqliteBoolean(row.enabled),
    rule: decodeSchemaJson(RouteRuleSchema, row.rule_json),
    destinationIds: decodeDestinationIds(row.destination_ids_json),
  });
}

export function encodeDestinationIds(destinationIds: string[]): string {
  return JSON.stringify(destinationIds);
}

export function decodeDestinationIds(value: string): string[] {
  return RouteDefinitionSchema.shape.destinationIds.parse(JSON.parse(value));
}

export function requireRoute(route: RouteDefinition | null): RouteDefinition {
  if (!route) {
    throw new RecordNotFoundError("Route");
  }

  return route;
}

export class SqliteRouteRepository implements RouteRepository {
  constructor(private readonly context: SqliteRepositoryContext) {}

  list(): RouteDefinition[] {
    return rowsAs<RouteRow>(
      this.context.db.prepare("SELECT * FROM routes ORDER BY name").all(),
    ).map((row) => routeFromRow(row));
  }

  listEnabled(): RouteDefinition[] {
    return rowsAs<RouteRow>(
      this.context.db.prepare("SELECT * FROM routes WHERE enabled = 1 ORDER BY name").all(),
    ).map((row) => routeFromRow(row));
  }

  get(id: string): RouteDefinition | null {
    const row = rowOrUndefined<RouteRow>(
      this.context.db.prepare("SELECT * FROM routes WHERE id = ?").get(id),
    );
    return row ? routeFromRow(row) : null;
  }

  create(input: CreateRouteInput): RouteDefinition {
    const now = this.context.now();
    const createdAt = input.createdAt ?? now;
    const route = RouteDefinitionSchema.parse({
      id: input.id ?? this.context.ids.route(),
      name: input.name,
      enabled: input.enabled ?? true,
      rule: input.rule,
      destinationIds: input.destinationIds,
    });
    const updatedAt = input.updatedAt ?? createdAt;

    this.context.db
      .prepare(
        `
          INSERT INTO routes (id, name, enabled, rule_json, destination_ids_json, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
      )
      .run(
        route.id,
        route.name,
        toSqliteBoolean(route.enabled),
        encodeSchemaJson(RouteRuleSchema, route.rule),
        encodeDestinationIds(route.destinationIds),
        createdAt,
        updatedAt,
      );

    return requireRoute(this.get(route.id));
  }

  update(id: string, input: UpdateRouteInput): RouteDefinition {
    const current = requireRoute(this.get(id));
    const route = RouteDefinitionSchema.parse({
      id,
      name: input.name ?? current.name,
      enabled: input.enabled ?? current.enabled,
      rule: input.rule ?? current.rule,
      destinationIds: input.destinationIds ?? current.destinationIds,
    });

    this.context.db
      .prepare(
        `
          UPDATE routes
          SET name = ?, enabled = ?, rule_json = ?, destination_ids_json = ?, updated_at = ?
          WHERE id = ?
        `,
      )
      .run(
        route.name,
        toSqliteBoolean(route.enabled),
        encodeSchemaJson(RouteRuleSchema, route.rule),
        encodeDestinationIds(route.destinationIds),
        input.updatedAt ?? this.context.now(),
        id,
      );

    return requireRoute(this.get(id));
  }

  setEnabled(id: string, enabled: boolean): RouteDefinition {
    return this.update(id, { enabled });
  }
}
