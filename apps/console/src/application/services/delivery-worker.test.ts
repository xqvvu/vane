import { createDefaultDestinationRegistry } from "@vane/destinations";
import { describe, expect, it } from "vitest";

import { ConfigurationService } from "#/application/services/configuration.ts";
import { DeliveryWorker } from "#/application/services/delivery-worker.ts";
import { openSqliteStore } from "#/infra/sqlite/store.ts";

const now = "2026-06-09T08:00:00.000Z";

function createStore() {
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

function seedDelivery(store: ReturnType<typeof createStore>, input: { maxAttempts?: number } = {}) {
  store.sources.create({
    id: "source-1",
    name: "Generic source",
    provider: "generic",
    tokenHash: "token-hash",
  });
  store.destinations.create({
    id: "destination-1",
    name: "Ops webhook",
    kind: "generic_webhook",
    config: {
      url: "https://example.test/webhook",
    },
  });
  const route = store.routes.create({
    id: "route-1",
    name: "All alerts",
    destinationIds: ["destination-1"],
  });
  const event = store.intake.recordEvent({
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
  });
  const enqueue = store.deliveries.enqueueForEvent({
    event,
    matches: [{ routeId: route.id, destinationIds: route.destinationIds }],
    dedupeWindowStartsAt: "2026-06-09T07:55:00.000Z",
    maxAttempts: input.maxAttempts,
  });

  return enqueue.created[0]!;
}

describe("delivery worker", () => {
  it("sends claimed deliveries and records successful attempts", async () => {
    const store = createStore();
    const delivery = seedDelivery(store);
    const worker = new DeliveryWorker({
      store,
      destinations: createDefaultDestinationRegistry(),
      now: () => now,
      sendContext: {
        fetch: async () => ({
          ok: true,
          status: 202,
          text: async () => "accepted",
        }),
      },
    });

    const result = await worker.runOnce();
    const detail = store.deliveries.get(delivery.id);

    expect(result).toEqual({
      claimed: 1,
      succeeded: 1,
      failed: 0,
      retrying: 0,
    });
    expect(detail?.job.state).toBe("succeeded");
    expect(detail?.job.attemptCount).toBe(1);
    expect(detail?.renderedPayload).toMatchObject({
      eventId: "event-1",
      alert: {
        title: "Checkout unavailable",
      },
    });
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

  it("sends Feishu deliveries through the default destination registry", async () => {
    const store = createStore();

    store.sources.create({
      id: "source-1",
      name: "Grafana source",
      provider: "grafana",
      tokenHash: "token-hash",
    });
    store.destinations.create({
      id: "destination-1",
      name: "Feishu SRE",
      kind: "feishu",
      config: {
        webhookUrl: "https://open.feishu.cn/open-apis/bot/v2/hook/example",
      },
    });
    const route = store.routes.create({
      id: "route-1",
      name: "Critical to Feishu",
      destinationIds: ["destination-1"],
    });
    const event = store.intake.recordEvent({
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
    });
    const enqueue = store.deliveries.enqueueForEvent({
      event,
      matches: [{ routeId: route.id, destinationIds: route.destinationIds }],
      dedupeWindowStartsAt: "2026-06-09T07:55:00.000Z",
    });
    const calls: Array<{ url: string; init: RequestInit }> = [];
    const worker = new DeliveryWorker({
      store,
      destinations: createDefaultDestinationRegistry(),
      now: () => now,
      sendContext: {
        fetch: async (url, init) => {
          calls.push({ url, init });
          return {
            ok: true,
            status: 200,
            text: async () => JSON.stringify({ code: 0, msg: "success" }),
          };
        },
      },
    });

    const result = await worker.runOnce();
    const detail = store.deliveries.get(enqueue.created[0]!.id);

    expect(result).toEqual({
      claimed: 1,
      succeeded: 1,
      failed: 0,
      retrying: 0,
    });
    expect(calls[0]?.url).toBe("https://open.feishu.cn/open-apis/bot/v2/hook/example");
    expect(detail?.renderedPayload).toMatchObject({
      msg_type: "text",
      content: {
        text: expect.stringContaining("[CRITICAL] Checkout unavailable"),
      },
    });

    store.close();
  });

  it("sends Slack deliveries through the default destination registry", async () => {
    const store = createStore();

    store.sources.create({
      id: "source-1",
      name: "Alertmanager source",
      provider: "alertmanager",
      tokenHash: "token-hash",
    });
    store.destinations.create({
      id: "destination-1",
      name: "Slack SRE",
      kind: "slack",
      config: {
        webhookUrl: "https://hooks.slack.com/services/example",
      },
    });
    const route = store.routes.create({
      id: "route-1",
      name: "Critical to Slack",
      destinationIds: ["destination-1"],
    });
    const event = store.intake.recordEvent({
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
    });
    const enqueue = store.deliveries.enqueueForEvent({
      event,
      matches: [{ routeId: route.id, destinationIds: route.destinationIds }],
      dedupeWindowStartsAt: "2026-06-09T07:55:00.000Z",
    });
    const calls: Array<{ url: string; init: RequestInit }> = [];
    const worker = new DeliveryWorker({
      store,
      destinations: createDefaultDestinationRegistry(),
      now: () => now,
      sendContext: {
        fetch: async (url, init) => {
          calls.push({ url, init });
          return {
            ok: true,
            status: 200,
            text: async () => "ok",
          };
        },
      },
    });

    const result = await worker.runOnce();
    const detail = store.deliveries.get(enqueue.created[0]!.id);

    expect(result).toEqual({
      claimed: 1,
      succeeded: 1,
      failed: 0,
      retrying: 0,
    });
    expect(calls[0]?.url).toBe("https://hooks.slack.com/services/example");
    expect(detail?.renderedPayload).toMatchObject({
      text: "[CRITICAL] Checkout unavailable",
      blocks: expect.any(Array),
    });

    store.close();
  });

  it("sends email deliveries through the default destination registry", async () => {
    const store = createStore();

    store.sources.create({
      id: "source-1",
      name: "Uptime Kuma source",
      provider: "uptime_kuma",
      tokenHash: "token-hash",
    });
    store.destinations.create({
      id: "destination-1",
      name: "Email SRE",
      kind: "email",
      config: {
        endpointUrl: "https://mail-gateway.example.test/send",
        to: ["sre@example.test"],
        from: "vane@example.test",
        subjectPrefix: "[Vane]",
      },
    });
    const route = store.routes.create({
      id: "route-1",
      name: "Critical to email",
      destinationIds: ["destination-1"],
    });
    const event = store.intake.recordEvent({
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
    });
    const enqueue = store.deliveries.enqueueForEvent({
      event,
      matches: [{ routeId: route.id, destinationIds: route.destinationIds }],
      dedupeWindowStartsAt: "2026-06-09T07:55:00.000Z",
    });
    const calls: Array<{ url: string; init: RequestInit }> = [];
    const worker = new DeliveryWorker({
      store,
      destinations: createDefaultDestinationRegistry(),
      now: () => now,
      sendContext: {
        fetch: async (url, init) => {
          calls.push({ url, init });
          return {
            ok: true,
            status: 202,
            text: async () => "queued",
          };
        },
      },
    });

    const result = await worker.runOnce();
    const detail = store.deliveries.get(enqueue.created[0]!.id);

    expect(result).toEqual({
      claimed: 1,
      succeeded: 1,
      failed: 0,
      retrying: 0,
    });
    expect(calls[0]?.url).toBe("https://mail-gateway.example.test/send");
    expect(JSON.parse(calls[0]?.init.body as string)).toMatchObject({
      to: ["sre@example.test"],
      from: "vane@example.test",
      subject: "[Vane] [CRITICAL firing] Checkout unavailable",
    });
    expect(detail?.renderedPayload).toMatchObject({
      subject: "[Vane] [CRITICAL firing] Checkout unavailable",
      metadata: {
        eventId: "event-1",
        destinationId: "destination-1",
      },
    });
    expect(detail?.renderedPayload).not.toHaveProperty("to");
    expect(detail?.renderedPayload).not.toHaveProperty("from");

    store.close();
  });

  it("records failed attempts and schedules bounded retries with backoff", async () => {
    const store = createStore();
    const delivery = seedDelivery(store, { maxAttempts: 2 });
    const worker = new DeliveryWorker({
      store,
      destinations: createDefaultDestinationRegistry(),
      now: () => now,
      backoff: {
        initialDelayMs: 60_000,
        maxDelayMs: 60_000,
      },
      sendContext: {
        fetch: async () => ({
          ok: false,
          status: 503,
          text: async () => "unavailable token=downstream-token password: downstream-password",
        }),
      },
    });

    const first = await worker.runOnce();
    const afterFirst = store.deliveries.get(delivery.id);

    expect(first).toEqual({
      claimed: 1,
      succeeded: 0,
      failed: 0,
      retrying: 1,
    });
    expect(afterFirst?.job.state).toBe("pending");
    expect(afterFirst?.job.nextAttemptAt).toBe("2026-06-09T08:01:00.000Z");
    expect(afterFirst?.job.lastError).toBe("Generic webhook returned HTTP 503");

    const second = await worker.runOnce({
      now: "2026-06-09T08:01:00.000Z",
    });
    const afterSecond = store.deliveries.get(delivery.id);

    expect(second).toEqual({
      claimed: 1,
      succeeded: 0,
      failed: 1,
      retrying: 0,
    });
    expect(afterSecond?.job.state).toBe("failed");
    expect(afterSecond?.job.nextAttemptAt).toBeNull();
    expect(afterSecond?.job.finishedAt).toBe("2026-06-09T08:01:00.000Z");
    expect(afterSecond?.attempts).toMatchObject([
      {
        attemptNumber: 1,
        state: "failed",
        responseStatus: 503,
        responseBody: "unavailable token=[REDACTED] password: [REDACTED]",
      },
      {
        attemptNumber: 2,
        state: "failed",
        responseStatus: 503,
        responseBody: "unavailable token=[REDACTED] password: [REDACTED]",
      },
    ]);
    expect(JSON.stringify(afterSecond)).not.toContain("downstream-token");
    expect(JSON.stringify(afterSecond)).not.toContain("downstream-password");

    store.close();
  });

  it("marks thrown sender errors as retryable delivery failures", async () => {
    const store = createStore();
    const delivery = seedDelivery(store);
    const worker = new DeliveryWorker({
      store,
      destinations: createDefaultDestinationRegistry(),
      now: () => now,
      sendContext: {
        fetch: async () => {
          throw new Error("network down token=transport-token");
        },
      },
    });

    const result = await worker.runOnce();
    const detail = store.deliveries.get(delivery.id);

    expect(result).toEqual({
      claimed: 1,
      succeeded: 0,
      failed: 0,
      retrying: 1,
    });
    expect(detail?.job.state).toBe("pending");
    expect(detail?.job.lastError).toBe("network down token=[REDACTED]");
    expect(detail?.attempts).toMatchObject([
      {
        attemptNumber: 1,
        state: "failed",
        error: "network down token=[REDACTED]",
      },
    ]);
    expect(JSON.stringify(detail)).not.toContain("transport-token");

    store.close();
  });

  it("retries a failed delivery successfully after destination config is fixed", async () => {
    const store = createStore();
    const delivery = seedDelivery(store, { maxAttempts: 1 });
    const calls: string[] = [];
    const worker = new DeliveryWorker({
      store,
      destinations: createDefaultDestinationRegistry(),
      now: () => now,
      sendContext: {
        fetch: async (url) => {
          calls.push(String(url));

          if (String(url) === "https://example.test/fixed-webhook") {
            return {
              ok: true,
              status: 202,
              text: async () => "accepted",
            };
          }

          return {
            ok: false,
            status: 500,
            text: async () => "bad endpoint",
          };
        },
      },
    });

    const first = await worker.runOnce();
    const failed = store.deliveries.get(delivery.id);

    expect(first).toEqual({
      claimed: 1,
      succeeded: 0,
      failed: 1,
      retrying: 0,
    });
    expect(failed?.job.state).toBe("failed");
    expect(calls).toEqual(["https://example.test/webhook"]);

    const configuration = new ConfigurationService({
      store,
      destinations: createDefaultDestinationRegistry(),
    });

    configuration.updateDestination({
      id: "destination-1",
      config: {
        url: "https://example.test/fixed-webhook",
      },
    });
    const retried = store.deliveries.retryNow({
      deliveryId: delivery.id,
      requestedAt: "2026-06-09T08:05:00.000Z",
    });

    expect(retried.state).toBe("pending");
    expect(retried.maxAttempts).toBe(2);

    const second = await worker.runOnce({
      now: "2026-06-09T08:05:00.000Z",
    });
    const succeeded = store.deliveries.get(delivery.id);

    expect(second).toEqual({
      claimed: 1,
      succeeded: 1,
      failed: 0,
      retrying: 0,
    });
    expect(calls).toEqual(["https://example.test/webhook", "https://example.test/fixed-webhook"]);
    expect(succeeded?.job.state).toBe("succeeded");
    expect(succeeded?.job.attemptCount).toBe(2);
    expect(succeeded?.attempts).toMatchObject([
      {
        attemptNumber: 1,
        state: "failed",
        responseStatus: 500,
      },
      {
        attemptNumber: 2,
        state: "succeeded",
        responseStatus: 202,
      },
    ]);

    store.close();
  });
});
