import { describe, expect, it } from "vitest";

import { InvalidDeliveryStateError } from "#/infra/sqlite/repositories/delivery/delivery.interface.ts";
import { openSqliteStore } from "#/infra/sqlite/store.ts";

const now = "2026-06-07T00:00:00.000Z";

describe("sqlite store", () => {
  it("uses injected id factories for every repository-owned record", async () => {
    let nextId = 0;
    const store = await openSqliteStore({
      databasePath: ":memory:",
      now: () => now,
      ids: {
        source: () => `source-${++nextId}`,
        destination: () => `destination-${++nextId}`,
        route: () => `route-${++nextId}`,
        event: () => `event-${++nextId}`,
        delivery: () => `delivery-${++nextId}`,
        attempt: () => `attempt-${++nextId}`,
      },
    });

    const source = await store.sources.create({
      name: "Grafana",
      provider: "grafana",
      tokenHash: "token-hash",
    });
    const destination = await store.destinations.create({
      name: "Ops webhook",
      kind: "generic_webhook",
    });
    const route = await store.routes.create({
      name: "All alerts",
      destinationIds: [destination.id],
    });
    const event = await store.intake.recordEvent({
      sourceId: source.id,
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
    const delivery = (
      await store.deliveries.enqueueForEvent({
        event,
        matches: [{ routeId: route.id, destinationIds: route.destinationIds }],
        dedupeWindowStartsAt: "2026-06-06T23:55:00.000Z",
      })
    ).created[0]!;
    const claim = (await store.deliveries.claimNext({ limit: 1 }))[0]!;

    expect({
      sourceId: source.id,
      destinationId: destination.id,
      routeId: route.id,
      eventId: event.id,
      deliveryId: delivery.id,
      attemptId: claim.attempt.id,
    }).toEqual({
      sourceId: "source-1",
      destinationId: "destination-2",
      routeId: "route-3",
      eventId: "event-4",
      deliveryId: "delivery-5",
      attemptId: "attempt-6",
    });

    await store.close();
  });

  it("records duplicate events while deduping deliveries for the same idempotency key", async () => {
    let nextId = 0;
    const store = await openSqliteStore({
      databasePath: ":memory:",
      now: () => now,
      ids: {
        event: () => `event-${++nextId}`,
        delivery: () => `delivery-${++nextId}`,
        attempt: () => `attempt-${++nextId}`,
      },
    });

    await store.sources.create({
      id: "source-1",
      name: "Grafana",
      provider: "grafana",
      tokenHash: "token-hash",
    });
    await store.destinations.create({
      id: "destination-1",
      name: "Ops webhook",
      kind: "generic_webhook",
    });
    const route = await store.routes.create({
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

    const firstEvent = await store.intake.recordEvent(eventInput);
    const firstEnqueue = await store.deliveries.enqueueForEvent({
      event: firstEvent,
      matches: [{ routeId: route.id, destinationIds: route.destinationIds }],
      dedupeWindowStartsAt: "2026-06-06T23:55:00.000Z",
    });
    const duplicateEvent = await store.intake.recordEvent(eventInput);
    const duplicateEnqueue = await store.deliveries.enqueueForEvent({
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

    const events = await store.history.listEvents();

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

    await store.close();
  });

  it("claims pending deliveries with event, source, destination, route, and attempt context", async () => {
    let nextId = 0;
    const store = await openSqliteStore({
      databasePath: ":memory:",
      now: () => now,
      ids: {
        event: () => `event-${++nextId}`,
        delivery: () => `delivery-${++nextId}`,
        attempt: () => `attempt-${++nextId}`,
      },
    });

    await store.sources.create({
      id: "source-1",
      name: "Grafana",
      provider: "grafana",
      tokenHash: "token-hash",
    });
    await store.destinations.create({
      id: "destination-1",
      name: "Ops webhook",
      kind: "generic_webhook",
      config: {
        url: "https://example.test/webhook",
      },
    });
    const route = await store.routes.create({
      id: "route-1",
      name: "All alerts",
      destinationIds: ["destination-1"],
    });
    const event = await store.intake.recordEvent({
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

    await store.deliveries.enqueueForEvent({
      event,
      matches: [{ routeId: route.id, destinationIds: route.destinationIds }],
      dedupeWindowStartsAt: "2026-06-06T23:55:00.000Z",
    });

    const claimed = await store.deliveries.claimNext({ limit: 10 });

    expect(claimed).toHaveLength(1);
    expect(claimed[0]?.event.id).toBe(event.id);
    expect(claimed[0]?.source.id).toBe("source-1");
    expect(claimed[0]?.destination.config).toEqual({ url: "https://example.test/webhook" });
    expect(claimed[0]?.route?.id).toBe(route.id);
    expect(claimed[0]?.attempt.attemptNumber).toBe(1);
    expect(claimed[0]?.job.state).toBe("running");

    const updated = await store.deliveries.markSucceeded({
      deliveryId: claimed[0]!.job.id,
      attemptId: claimed[0]!.attempt.id,
      responseStatus: 202,
      responseBody: "accepted token=delivery-secret password: hidden",
      renderedPayload: { ok: true },
    });
    const detail = await store.deliveries.get(updated.id);

    expect(updated.state).toBe("succeeded");
    expect(detail?.renderedPayload).toEqual({ ok: true });
    expect(detail?.attempts).toMatchObject([
      {
        attemptNumber: 1,
        state: "succeeded",
        responseStatus: 202,
        responseBody: "accepted token=[REDACTED] password: [REDACTED]",
      },
    ]);

    await store.close();
  });

  it("pauses pending delivery claims while the destination or route is disabled", async () => {
    let nextId = 0;
    const store = await openSqliteStore({
      databasePath: ":memory:",
      now: () => now,
      ids: {
        event: () => `event-${++nextId}`,
        delivery: () => `delivery-${++nextId}`,
        attempt: () => `attempt-${++nextId}`,
      },
    });

    await store.sources.create({
      id: "source-1",
      name: "Grafana",
      provider: "grafana",
      tokenHash: "token-hash",
    });
    await store.destinations.create({
      id: "destination-1",
      name: "Ops webhook",
      kind: "generic_webhook",
      config: {
        url: "https://example.test/webhook",
      },
    });
    const route = await store.routes.create({
      id: "route-1",
      name: "All alerts",
      destinationIds: ["destination-1"],
    });
    const event = await store.intake.recordEvent({
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

    await store.deliveries.enqueueForEvent({
      event,
      matches: [{ routeId: route.id, destinationIds: route.destinationIds }],
      dedupeWindowStartsAt: "2026-06-06T23:55:00.000Z",
    });

    await store.destinations.setEnabled("destination-1", false);
    expect(await store.deliveries.claimNext({ limit: 1 })).toHaveLength(0);

    await store.destinations.setEnabled("destination-1", true);
    await store.routes.setEnabled("route-1", false);
    expect(await store.deliveries.claimNext({ limit: 1 })).toHaveLength(0);

    await store.routes.setEnabled("route-1", true);
    expect(await store.deliveries.claimNext({ limit: 1 })).toHaveLength(1);

    await store.close();
  });

  it("manual retry only accepts failed deliveries and schedules an exhausted job for one more attempt", async () => {
    let nextId = 0;
    const store = await openSqliteStore({
      databasePath: ":memory:",
      now: () => now,
      ids: {
        event: () => `event-${++nextId}`,
        delivery: () => `delivery-${++nextId}`,
        attempt: () => `attempt-${++nextId}`,
      },
    });

    await store.sources.create({
      id: "source-1",
      name: "Grafana",
      provider: "grafana",
      tokenHash: "token-hash",
    });
    await store.destinations.create({
      id: "destination-1",
      name: "Ops webhook",
      kind: "generic_webhook",
      config: {
        url: "https://example.test/webhook",
      },
    });
    const route = await store.routes.create({
      id: "route-1",
      name: "All alerts",
      destinationIds: ["destination-1"],
    });
    const event = await store.intake.recordEvent({
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
    const delivery = (
      await store.deliveries.enqueueForEvent({
        event,
        matches: [{ routeId: route.id, destinationIds: route.destinationIds }],
        dedupeWindowStartsAt: "2026-06-06T23:55:00.000Z",
        maxAttempts: 1,
      })
    ).created[0]!;

    await expect(store.deliveries.retryNow({ deliveryId: delivery.id })).rejects.toThrow(
      InvalidDeliveryStateError,
    );

    const claimed = await store.deliveries.claimNext({ limit: 1 });
    await store.deliveries.markFailed({
      deliveryId: claimed[0]!.job.id,
      attemptId: claimed[0]!.attempt.id,
      error: "destination unavailable",
      retryAt: null,
      responseStatus: 503,
      responseBody: "unavailable",
      finishedAt: "2026-06-07T00:01:00.000Z",
    });

    const retried = await store.deliveries.retryNow({
      deliveryId: delivery.id,
      requestedAt: "2026-06-07T00:02:00.000Z",
    });

    expect(retried).toMatchObject({
      state: "pending",
      attemptCount: 1,
      maxAttempts: 2,
      nextAttemptAt: "2026-06-07T00:02:00.000Z",
      lastError: null,
      finishedAt: null,
    });

    await store.destinations.setEnabled("destination-1", false);
    expect(
      await store.deliveries.claimNext({
        now: "2026-06-07T00:02:00.000Z",
        limit: 1,
      }),
    ).toHaveLength(0);

    await store.destinations.setEnabled("destination-1", true);

    const retryClaim = await store.deliveries.claimNext({
      now: "2026-06-07T00:02:00.000Z",
      limit: 1,
    });

    expect(retryClaim).toHaveLength(1);
    expect(retryClaim[0]?.attempt.attemptNumber).toBe(2);

    await store.close();
  });

  it("filters operational history and exposes event and delivery details", async () => {
    let nextId = 0;
    const store = await openSqliteStore({
      databasePath: ":memory:",
      now: () => now,
      ids: {
        event: () => `event-${++nextId}`,
        delivery: () => `delivery-${++nextId}`,
        attempt: () => `attempt-${++nextId}`,
      },
    });

    await store.sources.create({
      id: "source-1",
      name: "Grafana",
      provider: "grafana",
      tokenHash: "token-hash",
    });
    await store.sources.create({
      id: "source-2",
      name: "Uptime Kuma",
      provider: "uptime_kuma",
      tokenHash: "token-hash-2",
    });
    await store.destinations.create({
      id: "destination-1",
      name: "Ops webhook",
      kind: "generic_webhook",
      config: {
        url: "https://example.test/webhook",
        headers: {
          Authorization: "Bearer destination-secret",
          "X-Team": "sre",
        },
      },
    });
    await store.destinations.create({
      id: "destination-2",
      name: "Audit email",
      kind: "email",
      config: {
        endpointUrl: "https://mail.example.test/send",
        to: ["audit@example.test"],
        from: "vane@example.test",
      },
    });
    const criticalRoute = await store.routes.create({
      id: "route-1",
      name: "Critical route",
      rule: {
        severities: ["critical"],
      },
      destinationIds: ["destination-1"],
    });
    const uptimeRoute = await store.routes.create({
      id: "route-2",
      name: "Uptime audit",
      rule: {
        sourceIds: ["source-2"],
      },
      destinationIds: ["destination-2"],
    });

    const criticalEvent = await store.intake.recordEvent({
      sourceId: "source-1",
      idempotencyKey: "request-1",
      normalized: {
        title: "CPU high",
        message: "CPU is above threshold",
        severity: "critical",
        status: "firing",
        fingerprint: "cpu:api",
        labels: { service: "api" },
        occurredAt: now,
      },
      rawPayload: {
        title: "CPU high",
      },
      rawHeaders: {
        "x-provider": "grafana",
      },
    });
    const uptimeEvent = await store.intake.recordEvent({
      sourceId: "source-2",
      idempotencyKey: "request-2",
      normalized: {
        title: "API recovered",
        message: "Health check resolved",
        severity: "info",
        status: "resolved",
        fingerprint: "uptime:api",
        labels: { service: "api" },
        occurredAt: now,
      },
      rawPayload: {
        msg: "up",
      },
    });

    const criticalDelivery = (
      await store.deliveries.enqueueForEvent({
        event: criticalEvent,
        matches: [{ routeId: criticalRoute.id, destinationIds: criticalRoute.destinationIds }],
        dedupeWindowStartsAt: "2026-06-06T23:55:00.000Z",
      })
    ).created[0]!;
    await store.deliveries.enqueueForEvent({
      event: uptimeEvent,
      matches: [{ routeId: uptimeRoute.id, destinationIds: uptimeRoute.destinationIds }],
      dedupeWindowStartsAt: "2026-06-06T23:55:00.000Z",
    });

    const claimed = await store.deliveries.claimNext({ limit: 1 });
    await store.deliveries.markFailed({
      deliveryId: claimed[0]!.job.id,
      attemptId: claimed[0]!.attempt.id,
      error: "destination unavailable token=delivery-secret",
      retryAt: null,
      responseStatus: 503,
      responseBody: "unavailable password: hidden",
    });

    expect((await store.history.listEvents({ severity: "critical" })).items).toHaveLength(1);
    expect((await store.history.listEvents({ status: "resolved" })).items[0]?.id).toBe(
      uptimeEvent.id,
    );
    expect((await store.history.listEvents({ q: "CPU" })).items[0]?.id).toBe(criticalEvent.id);
    expect((await store.history.listDeliveries({ severity: "critical" })).items[0]?.id).toBe(
      criticalDelivery.id,
    );
    expect((await store.history.listDeliveries({ status: "resolved" })).items).toHaveLength(1);
    expect((await store.history.listDeliveries({ q: "CPU" })).items[0]?.id).toBe(
      criticalDelivery.id,
    );
    expect(
      (await store.history.listDeliveries({ destinationId: "destination-1" })).items[0]?.id,
    ).toBe(criticalDelivery.id);
    expect((await store.history.listDeliveries({ state: "failed" })).items[0]?.lastError).toBe(
      "destination unavailable token=[REDACTED]",
    );
    const eventFirstPage = await store.history.listEvents({ limit: 1 });
    const eventSecondPage = await store.history.listEvents({
      limit: 1,
      cursor: eventFirstPage.nextCursor ?? undefined,
    });
    const deliveryFirstPage = await store.history.listDeliveries({ limit: 1 });
    const deliverySecondPage = await store.history.listDeliveries({
      limit: 1,
      cursor: deliveryFirstPage.nextCursor ?? undefined,
    });

    expect(eventFirstPage.nextCursor).toBeTruthy();
    expect(eventSecondPage.items.map((event) => event.id)).toEqual([criticalEvent.id]);
    expect(eventSecondPage.nextCursor).toBeNull();
    expect(deliveryFirstPage.nextCursor).toBeTruthy();
    expect(deliverySecondPage.items).toHaveLength(1);
    expect(deliverySecondPage.items[0]?.id).not.toBe(deliveryFirstPage.items[0]?.id);
    expect(deliverySecondPage.nextCursor).toBeNull();

    const eventDetail = await store.history.getEventDetail(criticalEvent.id);
    const deliveryDetail = await store.deliveries.get(criticalDelivery.id);

    expect(eventDetail?.event.rawPayload).toEqual({ title: "CPU high" });
    expect(eventDetail?.event.rawHeaders).toEqual({ "x-provider": "grafana" });
    expect(eventDetail?.deliveries).toMatchObject([
      {
        id: criticalDelivery.id,
        destinationId: "destination-1",
        destinationName: "Ops webhook",
        routeId: "route-1",
        routeName: "Critical route",
        state: "failed",
        attemptCount: 1,
        maxAttempts: 3,
        nextAttemptAt: null,
        lastError: "destination unavailable token=[REDACTED]",
      },
    ]);
    expect(JSON.stringify(eventDetail?.deliveries)).not.toContain("https://example.test/webhook");
    expect(JSON.stringify(eventDetail?.deliveries)).not.toContain("Bearer destination-secret");
    expect(eventDetail?.routeMatches).toMatchObject([
      {
        routeId: "route-1",
        routeName: "Critical route",
        matched: true,
        destinationIds: ["destination-1"],
      },
      {
        routeId: "route-2",
        routeName: "Uptime audit",
        matched: false,
        destinationIds: ["destination-2"],
      },
    ]);
    expect(
      eventDetail?.routeMatches
        .find((match) => match.routeId === "route-2")
        ?.checks.some((check) => check.field === "source" && !check.matched),
    ).toBe(true);
    expect(deliveryDetail?.destination).toMatchObject({
      id: "destination-1",
      name: "Ops webhook",
      kind: "generic_webhook",
    });
    expect(deliveryDetail?.destination).not.toHaveProperty("config");
    expect(deliveryDetail?.destinationMetadata).toEqual({
      method: "POST",
      templateConfigured: false,
      headerNames: ["Authorization", "X-Team"],
    });
    expect(JSON.stringify(deliveryDetail)).not.toContain("https://example.test/webhook");
    expect(JSON.stringify(deliveryDetail)).not.toContain("Bearer destination-secret");
    expect(deliveryDetail?.renderedPayload).toBeNull();
    expect(deliveryDetail?.attempts).toMatchObject([
      {
        attemptNumber: 1,
        state: "failed",
        responseStatus: 503,
        responseBody: "unavailable password: [REDACTED]",
        error: "destination unavailable token=[REDACTED]",
      },
    ]);

    await store.close();
  });
});
