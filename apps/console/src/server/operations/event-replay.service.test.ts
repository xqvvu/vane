import { describe, expect, it } from "vitest";

import { openSqliteStore } from "#/infra/sqlite/store.ts";
import { EventReplayService } from "#/server/operations/event-replay.service.ts";

const now = "2026-06-09T08:00:00.000Z";

async function createStore() {
  let nextId = 0;

  return openSqliteStore({
    databasePath: ":memory:",
    now: () => now,
    ids: {
      event: () => `event-${++nextId}`,
      delivery: () => `delivery-${++nextId}`,
      attempt: () => `attempt-${++nextId}`,
    },
  });
}

describe("event replay service", () => {
  it("creates missing deliveries for an old unmatched event without duplicating them", async () => {
    const store = await createStore();
    const service = new EventReplayService({ store, now: () => now });

    await store.sources.create({
      id: "source-1",
      name: "Generic source",
      provider: "generic",
      tokenHash: "token-hash",
    });
    await store.destinations.create({
      id: "destination-1",
      name: "Ops webhook",
      kind: "generic_webhook",
    });
    const event = await store.intake.recordEvent({
      sourceId: "source-1",
      idempotencyKey: "request-1",
      normalized: {
        title: "Checkout unavailable",
        message: "checkout returned 503",
        severity: "critical",
        status: "firing",
        fingerprint: "checkout:unavailable",
        labels: { service: "checkout" },
        occurredAt: now,
      },
      rawPayload: {},
      routeMatches: [],
    });

    await store.routes.create({
      id: "route-1",
      name: "Critical checkout",
      rule: {
        severities: ["critical"],
        labels: [{ key: "service", operator: "equals", value: "checkout" }],
      },
      destinationIds: ["destination-1"],
    });

    await expect(service.previewEventReplay({ eventId: event.id })).resolves.toMatchObject({
      eventId: event.id,
      matchedRouteCount: 1,
      newDeliveryCount: 1,
      existingDeliveryCount: 0,
      targets: [
        {
          routeId: "route-1",
          routeName: "Critical checkout",
          destinationId: "destination-1",
          deliveryId: null,
          alreadyExists: false,
        },
      ],
    });

    const firstReplay = await service.replayEvent({ eventId: event.id });

    expect(firstReplay?.createdDeliveryIds).toEqual(["delivery-2"]);
    expect(firstReplay?.skippedExistingCount).toBe(0);
    expect(firstReplay?.newDeliveryCount).toBe(1);

    const secondReplay = await service.replayEvent({ eventId: event.id });

    expect(secondReplay?.createdDeliveryIds).toEqual([]);
    expect(secondReplay?.skippedExistingCount).toBe(1);
    expect(secondReplay?.newDeliveryCount).toBe(0);
    expect(secondReplay?.existingDeliveryCount).toBe(1);

    await expect(service.previewEventReplay({ eventId: event.id })).resolves.toMatchObject({
      newDeliveryCount: 0,
      existingDeliveryCount: 1,
      targets: [
        {
          routeId: "route-1",
          destinationId: "destination-1",
          deliveryId: "delivery-2",
          alreadyExists: true,
        },
      ],
    });

    await store.close();
  });
});
