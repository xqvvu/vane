import {
  CreateRouteCommandSchema,
  UpdateRouteCommandSchema,
  type CreateRouteCommand,
  type RouteDefinition,
  type UpdateRouteCommand,
} from "@vane/core";

import type { SqliteStore } from "#/infra/sqlite/store.ts";
import {
  requireExistingDestinationIds,
  requireExistingSourceIds,
} from "#/server/configuration/configuration-support.ts";

export interface RouteServiceOptions {
  store: SqliteStore;
}

export class RouteService {
  private readonly store: SqliteStore;

  constructor(options: RouteServiceOptions) {
    this.store = options.store;
  }

  createRoute(command: CreateRouteCommand): RouteDefinition {
    const input = CreateRouteCommandSchema.parse(command);

    requireExistingSourceIds(input.rule?.sourceIds ?? [], this.store.sources);
    requireExistingDestinationIds(input.destinationIds, this.store.destinations);

    return this.store.routes.create({
      name: input.name,
      enabled: input.enabled,
      rule: input.rule,
      destinationIds: input.destinationIds,
    });
  }

  updateRoute(command: UpdateRouteCommand): RouteDefinition {
    const input = UpdateRouteCommandSchema.parse(command);

    if (input.rule) {
      requireExistingSourceIds(input.rule.sourceIds, this.store.sources);
    }

    if (input.destinationIds) {
      requireExistingDestinationIds(input.destinationIds, this.store.destinations);
    }

    return this.store.routes.update(input.id, {
      name: input.name,
      enabled: input.enabled,
      rule: input.rule,
      destinationIds: input.destinationIds,
    });
  }
}
