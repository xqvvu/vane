import { describe, expect, it } from "vitest";

import { genericWebhookSender } from "#/generic-webhook.ts";
import type { GenericWebhookConfig } from "#/generic-webhook.ts";
import type { DestinationSendInput, FetchLike } from "#/types.ts";

const input: DestinationSendInput<GenericWebhookConfig> = {
  eventId: "event-1",
  source: {
    id: "source-1",
    name: "Grafana prod",
    provider: "grafana",
    enabled: true,
  },
  destination: {
    id: "dest-1",
    name: "Internal relay",
    kind: "generic_webhook",
    enabled: true,
  },
  normalizedEvent: {
    title: "Checkout API latency high",
    message: "p95 latency exceeded",
    severity: "critical",
    status: "firing",
    fingerprint: "checkout-latency",
    labels: {
      service: "checkout",
    },
    occurredAt: "2026-06-07T08:00:00.000Z",
  },
  config: {
    url: "https://relay.example.test/vane",
    method: "POST",
    headers: {
      "X-Team": "sre",
    },
  },
};

describe("generic webhook sender", () => {
  it("sends normalized alert payloads through an injected transport", async () => {
    const calls: Array<{ url: string; init: RequestInit }> = [];
    const fetcher: FetchLike = async (url, init) => {
      calls.push({ url, init });
      return {
        ok: true,
        status: 202,
        text: async () => "accepted",
      };
    };

    const result = await genericWebhookSender.send(input, { fetch: fetcher });

    expect(result.success).toBe(true);
    expect(result.statusCode).toBe(202);
    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toBe("https://relay.example.test/vane");
    expect(calls[0]?.init.headers).toEqual({
      "Content-Type": "application/json",
      "X-Team": "sre",
    });
    const body = calls[0]?.init.body;
    expect(typeof body).toBe("string");
    expect(JSON.parse(body as string)).toMatchObject({
      eventId: "event-1",
      alert: {
        title: "Checkout API latency high",
        severity: "critical",
      },
    });
  });

  it("reports non-2xx responses as delivery failures", async () => {
    const fetcher: FetchLike = async () => ({
      ok: false,
      status: 500,
      text: async () => "down",
    });

    const result = await genericWebhookSender.send(input, { fetch: fetcher });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Generic webhook returned HTTP 500");
    expect(result.responseBody).toBe("down");
  });
});
