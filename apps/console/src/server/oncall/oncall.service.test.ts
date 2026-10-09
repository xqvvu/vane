import { describe, expect, it } from "vite-plus/test";

import type { AlertSeverity, AlertStatus, JsonObject, ProviderReference } from "@vane/core";

import type { ClaimedDelivery } from "#/infra/sqlite/repositories/delivery/delivery.interface";
import { openSqliteStore } from "#/infra/sqlite/store";
import { OncallService } from "#/server/oncall/oncall.service";

const now = "2026-10-09T08:00:00.000Z";
const messageReference: ProviderReference = { type: "feishu_message_id", value: "om_123" };

describe("oncall auto paging trigger", () => {
  it("enqueues one ping per receiver for a firing app-mode delivery", async () => {
    const store = await openSqliteStore({ databasePath: ":memory:", now: () => now });
    const { delivery } = await seedDelivery(store);
    const service = new OncallService({ store });

    await service.triggerPingsForDelivery({
      delivery,
      providerReference: messageReference,
      now,
    });

    const pings = await store.oncall.listForDelivery(delivery.job.id);

    expect(pings).toHaveLength(2);
    expect(pings.map((ping) => ping.receiver)).toEqual(["ou_1", "ou_2"]);
    expect(pings[0]).toMatchObject({
      deliveryId: delivery.job.id,
      destinationId: "destination-1",
      eventId: delivery.event.id,
      channel: "feishu_urgent_phone",
      state: "scheduled",
      trigger: "auto",
      initiatedBy: null,
      providerReference: messageReference,
      attemptCount: 0,
      maxAttempts: 3,
      nextAttemptAt: null,
      lastError: null,
      firedAt: null,
    });
  });

  it("suppresses repeat pages within the dedupe window for the same fingerprint, destination, and receiver", async () => {
    const store = await openSqliteStore({ databasePath: ":memory:", now: () => now });
    const { delivery } = await seedDelivery(store);
    const service = new OncallService({ store });

    await service.triggerPingsForDelivery({ delivery, providerReference: messageReference, now });
    await service.triggerPingsForDelivery({ delivery, providerReference: messageReference, now });

    expect(await store.oncall.listForDelivery(delivery.job.id)).toHaveLength(2);

    // Outside the window the same page is placed again.
    const later = "2026-10-09T08:06:00.000Z";

    await service.triggerPingsForDelivery({
      delivery,
      providerReference: messageReference,
      now: later,
    });

    expect(await store.oncall.listForDelivery(delivery.job.id)).toHaveLength(4);
  });

  it("exposes the paging records on the delivery detail", async () => {
    const store = await openSqliteStore({ databasePath: ":memory:", now: () => now });
    const { delivery } = await seedDelivery(store);
    const service = new OncallService({ store });

    await service.triggerPingsForDelivery({ delivery, providerReference: messageReference, now });

    const detail = await store.deliveries.get(delivery.job.id);

    expect(detail?.pings.map((ping) => ping.receiver)).toEqual(["ou_1", "ou_2"]);
    expect(detail?.pings[0]?.state).toBe("scheduled");
  });

  it("enqueues nothing for webhook mode, non-firing alerts, severity misses, disabled auto paging, and other kinds", async () => {
    const cases: Array<{
      name: string;
      config?: JsonObject;
      severity?: AlertSeverity;
      status?: AlertStatus;
    }> = [
      {
        name: "webhook mode",
        config: {
          sendMode: "webhook",
          webhookUrl: "https://open.feishu.cn/open-apis/bot/v2/hook/x",
        },
      },
      { name: "resolved alert", status: "resolved" },
      { name: "warning below the critical gate", severity: "warning" },
      { name: "auto paging disabled", config: appModeConfig({ autoEnabled: false }) },
    ];

    for (const testCase of cases) {
      const store = await openSqliteStore({ databasePath: ":memory:", now: () => now });
      const { delivery } = await seedDelivery(store, {
        config: testCase.config,
        severity: testCase.severity,
        status: testCase.status,
      });
      const service = new OncallService({ store });

      await service.triggerPingsForDelivery({
        delivery,
        providerReference: messageReference,
        now,
      });

      expect(
        await store.oncall.listForDelivery(delivery.job.id),
        `expected no pages for: ${testCase.name}`,
      ).toEqual([]);
    }
  });
});

function appModeConfig(
  urgent: { autoEnabled?: boolean; severities?: string[]; receivers?: string[] } = {},
): JsonObject {
  return {
    sendMode: "app",
    app: { appRef: "feishu-app-1", chatId: "oc_group" },
    urgent: {
      autoEnabled: true,
      severities: ["critical"],
      userIdType: "open_id",
      receivers: ["ou_1", "ou_2"],
      ...urgent,
    },
  };
}

async function seedDelivery(
  store: Awaited<ReturnType<typeof openSqliteStore>>,
  options: { config?: JsonObject; severity?: AlertSeverity; status?: AlertStatus } = {},
): Promise<{ delivery: ClaimedDelivery }> {
  await store.sources.create({
    id: "source-1",
    name: "Generic source",
    provider: "generic",
    tokenHash: "token-hash",
  });
  await store.destinations.create({
    id: "destination-1",
    name: "Feishu SRE",
    kind: "feishu",
    config: options.config ?? appModeConfig(),
  });
  const route = await store.routes.create({
    id: "route-1",
    name: "All alerts",
    destinationIds: ["destination-1"],
  });
  const event = await store.intake.recordEvent({
    sourceId: "source-1",
    idempotencyKey: "request-1",
    normalized: {
      title: "Checkout unavailable",
      message: "checkout returned 503",
      severity: options.severity ?? "critical",
      status: options.status ?? "firing",
      fingerprint: "checkout:unavailable",
      labels: { service: "checkout" },
      occurredAt: now,
    },
    rawPayload: {},
  });
  const enqueue = await store.deliveries.enqueueForEvent({
    event,
    matches: [{ routeId: route.id, destinationIds: route.destinationIds }],
    dedupeWindowStartsAt: "2026-10-09T07:55:00.000Z",
  });
  const job = enqueue.created[0]!;
  const storedEvent = await store.intake.get(job.eventId);
  const source = await store.sources.get("source-1");
  const destination = await store.destinations.get("destination-1");

  return {
    delivery: {
      job,
      attempt: {
        id: "attempt-1",
        deliveryId: job.id,
        attemptNumber: 1,
        state: "running",
        responseStatus: null,
        responseBody: null,
        error: null,
        startedAt: now,
        finishedAt: null,
      },
      event: storedEvent!,
      source: source!,
      destination: destination!,
      route: await store.routes.get("route-1"),
    },
  };
}
