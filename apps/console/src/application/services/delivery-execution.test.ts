import type { DeliveryJob } from "@vane/core";
import type { DestinationRegistry, DestinationSendContext } from "@vane/destinations";
import { describe, expect, it } from "vitest";

import {
  DeliveryExecution,
  type DeliveryExecutionStore,
} from "#/application/services/delivery-execution.ts";
import type { ClaimedDelivery, DeliveryRepository } from "#/infra/sqlite/deliveries.ts";

const now = "2026-06-09T08:00:00.000Z";

describe("delivery execution", () => {
  it("records successful sends through the delivery execution interface", async () => {
    const succeeded: Parameters<DeliveryRepository["markSucceeded"]>[0][] = [];
    const failed: Parameters<DeliveryRepository["markFailed"]>[0][] = [];
    const store = createExecutionStore({ succeeded, failed });
    const context: DestinationSendContext = {};
    const destinations = {
      async send(kind, input, sendContext) {
        expect(kind).toBe("generic_webhook");
        expect(input).toMatchObject({
          eventId: "event-1",
          config: {
            url: "https://example.test/webhook",
          },
        });
        expect(sendContext).toBe(context);

        return {
          ok: true,
          statusCode: 202,
          responseBody: "accepted token=downstream-token",
          renderedPayload: {
            eventId: input.eventId,
            title: input.normalizedEvent.title,
          },
        };
      },
    } satisfies Pick<DestinationRegistry, "send">;
    const execution = new DeliveryExecution({ store, destinations, sendContext: context });

    await expect(execution.execute(createClaimedDelivery(), now)).resolves.toBe("succeeded");

    expect(succeeded).toEqual([
      {
        deliveryId: "delivery-1",
        attemptId: "attempt-1",
        renderedPayload: {
          eventId: "event-1",
          title: "Checkout unavailable",
        },
        responseStatus: 202,
        responseBody: "accepted token=[REDACTED]",
        finishedAt: now,
      },
    ]);
    expect(failed).toEqual([]);
  });

  it("records failed sends with redaction and bounded retry timing", async () => {
    const succeeded: Parameters<DeliveryRepository["markSucceeded"]>[0][] = [];
    const failed: Parameters<DeliveryRepository["markFailed"]>[0][] = [];
    const store = createExecutionStore({ succeeded, failed, failedState: "pending" });
    const destinations = {
      async send() {
        return {
          ok: false,
          errorKind: "http_error",
          retryHint: "retryable",
          errorMessage: "Destination returned token=downstream-token",
          statusCode: 503,
          responseBody: "unavailable password: downstream-password",
          renderedPayload: {},
        };
      },
    } satisfies Pick<DestinationRegistry, "send">;
    const execution = new DeliveryExecution({
      store,
      destinations,
      backoff: {
        initialDelayMs: 60_000,
        maxDelayMs: 60_000,
      },
    });

    await expect(execution.execute(createClaimedDelivery(), now)).resolves.toBe("retrying");

    expect(succeeded).toEqual([]);
    expect(failed).toEqual([
      {
        deliveryId: "delivery-1",
        attemptId: "attempt-1",
        error: "Destination returned token=[REDACTED]",
        retryAt: "2026-06-09T08:01:00.000Z",
        responseStatus: 503,
        responseBody: "unavailable password: [REDACTED]",
        finishedAt: now,
      },
    ]);
  });

  it("records thrown sender errors as final failures once attempts are exhausted", async () => {
    const succeeded: Parameters<DeliveryRepository["markSucceeded"]>[0][] = [];
    const failed: Parameters<DeliveryRepository["markFailed"]>[0][] = [];
    const store = createExecutionStore({ succeeded, failed, failedState: "failed" });
    const destinations = {
      async send() {
        throw new Error("network down token=transport-token");
      },
    } satisfies Pick<DestinationRegistry, "send">;
    const execution = new DeliveryExecution({ store, destinations });

    await expect(
      execution.execute(createClaimedDelivery({ attemptCount: 1, maxAttempts: 1 }), now),
    ).resolves.toBe("failed");

    expect(succeeded).toEqual([]);
    expect(failed).toEqual([
      {
        deliveryId: "delivery-1",
        attemptId: "attempt-1",
        error: "network down token=[REDACTED]",
        retryAt: null,
        finishedAt: now,
      },
    ]);
  });
});

function createExecutionStore(input: {
  succeeded: Parameters<DeliveryRepository["markSucceeded"]>[0][];
  failed: Parameters<DeliveryRepository["markFailed"]>[0][];
  failedState?: DeliveryJob["state"];
}): DeliveryExecutionStore {
  return {
    deliveries: {
      markSucceeded(command) {
        input.succeeded.push(command);
        return deliveryJob({
          state: "succeeded",
          finishedAt: command.finishedAt ?? now,
        });
      },
      markFailed(command) {
        input.failed.push(command);
        return deliveryJob({
          state: input.failedState ?? "failed",
          nextAttemptAt: command.retryAt,
          lastError: command.error,
          finishedAt: command.retryAt === null ? (command.finishedAt ?? now) : null,
        });
      },
    },
  };
}

function createClaimedDelivery(input: Partial<DeliveryJob> = {}): ClaimedDelivery {
  const job = deliveryJob({
    state: "running",
    attemptCount: 1,
    maxAttempts: 3,
    ...input,
  });

  return {
    job,
    attempt: {
      id: "attempt-1",
      deliveryId: job.id,
      attemptNumber: job.attemptCount,
      state: "running",
      responseStatus: null,
      responseBody: null,
      error: null,
      startedAt: now,
      finishedAt: null,
    },
    event: {
      id: "event-1",
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
      providerMetadata: {},
      rawPayload: {},
      rawHeaders: {},
      routeMatches: null,
      receivedAt: now,
    },
    source: {
      id: "source-1",
      name: "Generic source",
      provider: "generic",
      enabled: true,
      tokenHash: "token-hash",
      config: {},
    },
    destination: {
      id: "destination-1",
      name: "Ops webhook",
      kind: "generic_webhook",
      enabled: true,
      config: {
        url: "https://example.test/webhook",
      },
      secretRefs: {},
    },
    route: null,
  };
}

function deliveryJob(input: Partial<DeliveryJob> = {}): DeliveryJob {
  return {
    id: "delivery-1",
    eventId: "event-1",
    destinationId: "destination-1",
    routeId: "route-1",
    state: "pending",
    attemptCount: 0,
    maxAttempts: 3,
    nextAttemptAt: null,
    lastError: null,
    createdAt: now,
    updatedAt: now,
    finishedAt: null,
    ...input,
  };
}
