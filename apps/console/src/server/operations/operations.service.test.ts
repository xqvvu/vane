import { describe, expect, it } from "vite-plus/test";

import { openSqliteStore } from "#/infra/sqlite/store";
import { OperationsService } from "#/server/operations/operations.service";

const now = "2026-06-09T08:00:00.000Z";

async function createStore() {
  return openSqliteStore({
    databasePath: ":memory:",
    now: () => now,
    ids: {
      source: () => "source-1",
      destination: () => "destination-1",
      route: () => "route-1",
      event: () => "event-1",
      delivery: () => "delivery-1",
      attempt: () => "attempt-1",
    },
  });
}

describe("operations service", () => {
  it("combines history projections and delegates delivery retry", async () => {
    const store = await createStore();
    const service = new OperationsService({ store });

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
      rule: { severities: ["critical"] },
      destinationIds: ["destination-1"],
    });

    const delivery = (
      await store.deliveries.enqueueForEvent({
        event,
        matches: [{ routeId: "route-1", destinationIds: ["destination-1"] }],
        dedupeWindowStartsAt: now,
        now,
      })
    ).created[0]!;
    const claimed = (await store.deliveries.claimNext({ now, limit: 1 }))[0]!;
    await store.deliveries.markFailed({
      deliveryId: delivery.id,
      attemptId: claimed.attempt.id,
      error: "upstream unavailable",
      retryAt: null,
      finishedAt: now,
    });

    await expect(service.listOperations({ limit: 10 })).resolves.toMatchObject({
      events: { items: [{ id: event.id }] },
      deliveries: { items: [{ id: delivery.id }] },
    });

    await expect(service.getEventDetail(event.id)).resolves.toMatchObject({
      event: { id: event.id },
    });
    await expect(service.getDeliveryDetail(delivery.id)).resolves.toMatchObject({
      job: { id: delivery.id },
    });

    await expect(service.retryDelivery(delivery.id)).resolves.toMatchObject({
      id: delivery.id,
      state: "pending",
    });

    await store.close();
  });
});
