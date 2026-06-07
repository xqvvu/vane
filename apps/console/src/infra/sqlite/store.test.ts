import { describe, expect, it } from "vitest";

import { openSqliteStore } from "#/infra/sqlite/store";

const now = "2026-06-07T00:00:00.000Z";

describe("sqlite store", () => {
  it("records duplicate events while deduping deliveries for the same idempotency key", () => {
    let nextId = 0;
    const store = openSqliteStore({
      databasePath: ":memory:",
      now: () => now,
      ids: {
        event: () => `event-${++nextId}`,
        delivery: () => `delivery-${++nextId}`,
        attempt: () => `attempt-${++nextId}`,
      },
    });

    store.sources.create({
      id: "source-1",
      name: "Grafana",
      provider: "grafana",
      tokenHash: "token-hash",
    });
    store.destinations.create({
      id: "destination-1",
      name: "Ops webhook",
      kind: "generic_webhook",
    });
    const route = store.routes.create({
      id: "route-1",
      name: "Critical alerts",
      rule: {
        severities: ["critical"],
      },
      destinationIds: ["destination-1"],
    });
    const eventInput = {
      sourceId: "source-1",
      idempotencyKey: "request-1",
      normalized: {
        title: "CPU high",
        message: "CPU is above threshold",
        severity: "critical" as const,
        status: "firing" as const,
        fingerprint: "cpu:api",
        labels: {
          service: "api",
        },
        occurredAt: now,
      },
      rawPayload: {
        title: "CPU high",
      },
    };

    const firstEvent = store.intake.recordEvent(eventInput);
    const firstEnqueue = store.deliveries.enqueueForEvent({
      event: firstEvent,
      matches: [{ routeId: route.id, destinationIds: route.destinationIds }],
      dedupeWindowStartsAt: "2026-06-06T23:55:00.000Z",
    });
    const duplicateEvent = store.intake.recordEvent(eventInput);
    const duplicateEnqueue = store.deliveries.enqueueForEvent({
      event: duplicateEvent,
      matches: [{ routeId: route.id, destinationIds: route.destinationIds }],
      dedupeWindowStartsAt: "2026-06-06T23:55:00.000Z",
    });

    expect(firstEvent.id).not.toBe(duplicateEvent.id);
    expect(firstEnqueue.created).toHaveLength(1);
    expect(firstEnqueue.deduped).toHaveLength(0);
    expect(duplicateEnqueue.created).toHaveLength(0);
    expect(duplicateEnqueue.deduped).toEqual([
      {
        sourceId: "source-1",
        idempotencyKey: "request-1",
        routeId: "route-1",
        destinationId: "destination-1",
        firstEventId: firstEvent.id,
      },
    ]);

    const events = store.history.listEvents();

    expect(events.items).toHaveLength(2);
    const duplicateEventItem = events.items.find((item) => item.id === duplicateEvent.id);
    const firstEventItem = events.items.find((item) => item.id === firstEvent.id);

    expect(duplicateEventItem?.deliveryCounts).toEqual({
      pending: 0,
      running: 0,
      succeeded: 0,
      failed: 0,
    });
    expect(firstEventItem?.deliveryCounts).toEqual({
      pending: 1,
      running: 0,
      succeeded: 0,
      failed: 0,
    });

    store.close();
  });

  it("claims pending deliveries with event, source, destination, route, and attempt context", () => {
    let nextId = 0;
    const store = openSqliteStore({
      databasePath: ":memory:",
      now: () => now,
      ids: {
        event: () => `event-${++nextId}`,
        delivery: () => `delivery-${++nextId}`,
        attempt: () => `attempt-${++nextId}`,
      },
    });

    store.sources.create({
      id: "source-1",
      name: "Grafana",
      provider: "grafana",
      tokenHash: "token-hash",
    });
    store.destinations.create({
      id: "destination-1",
      name: "Ops webhook",
      kind: "generic_webhook",
      config: { url: "https://example.test/webhook" },
    });
    const route = store.routes.create({
      id: "route-1",
      name: "All alerts",
      destinationIds: ["destination-1"],
    });
    const event = store.intake.recordEvent({
      sourceId: "source-1",
      idempotencyKey: null,
      normalized: {
        title: "CPU high",
        message: "CPU is above threshold",
        severity: "critical",
        status: "firing",
        fingerprint: "cpu:api",
        labels: {},
        occurredAt: now,
      },
      rawPayload: {},
    });

    store.deliveries.enqueueForEvent({
      event,
      matches: [{ routeId: route.id, destinationIds: route.destinationIds }],
      dedupeWindowStartsAt: "2026-06-06T23:55:00.000Z",
    });

    const claimed = store.deliveries.claimNext({ limit: 10 });

    expect(claimed).toHaveLength(1);
    expect(claimed[0]?.event.id).toBe(event.id);
    expect(claimed[0]?.source.id).toBe("source-1");
    expect(claimed[0]?.destination.config).toEqual({ url: "https://example.test/webhook" });
    expect(claimed[0]?.route?.id).toBe(route.id);
    expect(claimed[0]?.attempt.attemptNumber).toBe(1);
    expect(claimed[0]?.job.state).toBe("running");

    const updated = store.deliveries.markSucceeded({
      deliveryId: claimed[0]!.job.id,
      attemptId: claimed[0]!.attempt.id,
      responseStatus: 202,
      responseBody: "accepted",
      renderedPayload: { ok: true },
    });
    const detail = store.deliveries.get(updated.id);

    expect(updated.state).toBe("succeeded");
    expect(detail?.renderedPayload).toEqual({ ok: true });
    expect(detail?.attempts).toMatchObject([
      {
        attemptNumber: 1,
        state: "succeeded",
        responseStatus: 202,
        responseBody: "accepted",
      },
    ]);

    store.close();
  });
});
