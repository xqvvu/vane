import {
  CreateRouteCommandSchema,
  UpdateRouteCommandSchema,
  type CreateRouteCommand,
  type RouteDefinition,
  type UpdateRouteCommand,
} from "@vane/core";

import {
  requireExistingDestinationIds,
  requireExistingSourceIds,
} from "#/server/configuration/configuration-support.ts";
import type { RouteServiceOptions } from "#/server/routes/route.service.types.ts";

export class RouteService {
  private readonly store: RouteServiceOptions["store"];

  constructor(options: RouteServiceOptions) {
    this.store = options.store;
  }

  async createRoute(command: CreateRouteCommand): Promise<RouteDefinition> {
    const input = CreateRouteCommandSchema.parse(command);

    await requireExistingSourceIds(input.rule?.sourceIds ?? [], this.store.sources);
    await requireExistingDestinationIds(input.destinationIds, this.store.destinations);

    return this.store.routes.create({
      name: input.name,
      enabled: input.enabled,
      rule: input.rule,
      destinationIds: input.destinationIds,
    });
  }

  async updateRoute(command: UpdateRouteCommand): Promise<RouteDefinition> {
    const input = UpdateRouteCommandSchema.parse(command);

    if (input.rule) {
      await requireExistingSourceIds(input.rule.sourceIds, this.store.sources);
    }

    if (input.destinationIds) {
      await requireExistingDestinationIds(input.destinationIds, this.store.destinations);
    }

    return this.store.routes.update(input.id, {
      name: input.name,
      enabled: input.enabled,
      rule: input.rule,
      destinationIds: input.destinationIds,
    });
  }
}
