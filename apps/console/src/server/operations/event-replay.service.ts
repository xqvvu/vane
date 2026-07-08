import {
  findMatchingRoutes,
  ReplayEventCommandSchema,
  type EventRecord,
  type EventReplayPreview,
  type EventReplayResult,
  type EventReplayTarget,
  type ReplayEventCommand,
  type RouteMatchResult,
} from "@vane/core";

import type { EnqueueDeliveriesResult } from "#/infra/sqlite/repositories/delivery/delivery.interface.ts";
import type { SqliteStoreUnitOfWork } from "#/infra/sqlite/store.ts";
import type { EventReplayServiceOptions } from "#/server/operations/event-replay.service.types.ts";

export class EventReplayService {
  private readonly store: EventReplayServiceOptions["store"];
  private readonly now: () => string;
  private readonly dedupeWindowMs: number;

  constructor(options: EventReplayServiceOptions) {
    this.store = options.store;
    this.now = options.now ?? (() => new Date().toISOString());
    this.dedupeWindowMs = options.dedupeWindowMs ?? 5 * 60 * 1000;
  }

  async previewEventReplay(command: ReplayEventCommand): Promise<EventReplayPreview | null> {
    const input = ReplayEventCommandSchema.parse(command);
    const event = await this.store.intake.get(input.eventId);

    if (!event) {
      return null;
    }

    const routeMatches = await this.currentRouteMatches(this.store, event);

    return this.buildPreview(this.store, event, routeMatches, null);
  }

  async replayEvent(command: ReplayEventCommand): Promise<EventReplayResult | null> {
    const input = ReplayEventCommandSchema.parse(command);

    return this.store.transaction(async (tx) => {
      const event = await tx.intake.get(input.eventId);

      if (!event) {
        return null;
      }

      const routeMatches = await this.currentRouteMatches(tx, event);
      const matchedRoutes = routeMatches.filter((match) => match.matched);
      const now = this.now();
      const enqueue = await tx.deliveries.enqueueForEvent({
        event,
        matches: matchedRoutes.map((match) => ({
          routeId: match.routeId,
          destinationIds: match.destinationIds,
        })),
        dedupeWindowStartsAt: new Date(new Date(now).valueOf() - this.dedupeWindowMs).toISOString(),
        now,
        dedupeByIdempotency: false,
        skipExistingForEvent: true,
      });
      const preview = await this.buildPreview(tx, event, routeMatches, enqueue);

      return {
        ...preview,
        createdDeliveryIds: enqueue.created.map((delivery) => delivery.id),
        skippedExistingCount: enqueue.skippedExisting.length,
      };
    });
  }

  private async currentRouteMatches(
    store: Pick<SqliteStoreUnitOfWork, "routes">,
    event: EventRecord,
  ): Promise<RouteMatchResult[]> {
    return findMatchingRoutes(await store.routes.list(), {
      sourceId: event.sourceId,
      event: event.normalized,
    });
  }

  private async buildPreview(
    store: Pick<SqliteStoreUnitOfWork, "history">,
    event: EventRecord,
    routeMatches: RouteMatchResult[],
    enqueue: EnqueueDeliveriesResult | null,
  ): Promise<EventReplayPreview> {
    const targets = await this.eventReplayTargets(store, event, routeMatches, enqueue);
    const existingDeliveryCount = targets.filter((target) => target.alreadyExists).length;

    return {
      eventId: event.id,
      routeMatches,
      targets,
      matchedRouteCount: routeMatches.length,
      newDeliveryCount: targets.length - existingDeliveryCount,
      existingDeliveryCount,
    };
  }

  private async eventReplayTargets(
    store: Pick<SqliteStoreUnitOfWork, "history">,
    event: EventRecord,
    routeMatches: RouteMatchResult[],
    enqueue: EnqueueDeliveriesResult | null,
  ): Promise<EventReplayTarget[]> {
    const existingByTarget =
      enqueue === null ? await listExistingTargetsFromHistory(store, event.id) : new Map();
    const createdByTarget = new Map(
      enqueue?.created.map((delivery) => [
        deliveryTargetKey(delivery.routeId ?? "", delivery.destinationId),
        delivery.id,
      ]) ?? [],
    );
    const skippedByTarget = new Map(
      enqueue?.skippedExisting.map((target) => [
        deliveryTargetKey(target.routeId, target.destinationId),
        target.deliveryId,
      ]) ?? [],
    );

    return routeMatches.flatMap((match) =>
      match.destinationIds.map((destinationId) => {
        const key = deliveryTargetKey(match.routeId, destinationId);
        const createdDeliveryId = createdByTarget.get(key) ?? null;
        const skippedDeliveryId = skippedByTarget.get(key) ?? existingByTarget.get(key) ?? null;

        return {
          routeId: match.routeId,
          routeName: match.routeName,
          destinationId,
          deliveryId: createdDeliveryId ?? skippedDeliveryId,
          alreadyExists: skippedDeliveryId !== null,
        };
      }),
    );
  }
}

function deliveryTargetKey(routeId: string, destinationId: string): string {
  return `${routeId}\u0000${destinationId}`;
}

async function listExistingTargetsFromHistory(
  store: Pick<SqliteStoreUnitOfWork, "history">,
  eventId: string,
): Promise<Map<string, string>> {
  const detail = await store.history.getEventDetail(eventId);

  return new Map(
    detail?.deliveries
      .filter((delivery) => delivery.routeId !== null)
      .map((delivery) => [
        deliveryTargetKey(delivery.routeId ?? "", delivery.destinationId),
        delivery.id,
      ]) ?? [],
  );
}
