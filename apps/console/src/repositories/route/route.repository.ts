import { encodeSchemaJson, RouteDefinitionSchema, RouteRuleSchema } from "@vane/core";
import type { RouteDefinition } from "@vane/core";

import { rowOrUndefined, rowsAs, toSqliteBoolean } from "#/infra/sqlite/codecs.ts";
import type { SqliteRepositoryContext } from "#/infra/sqlite/context.ts";
import {
  encodeDestinationIds,
  requireRoute,
  routeFromRow,
} from "#/repositories/route/route.helpers.ts";
import type {
  CreateRouteInput,
  RouteRepository,
  RouteRow,
  UpdateRouteInput,
} from "#/repositories/route/route.interface.ts";

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
