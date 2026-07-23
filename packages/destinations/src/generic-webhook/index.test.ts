import { describe, expect, it } from "vitest";

import { genericWebhookSender } from "#destinations/generic-webhook/index";
import type { GenericWebhookConfig } from "#destinations/generic-webhook/index";
import type { DestinationSendInput, FetchLike } from "#destinations/types";

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

    expect(result.ok).toBe(true);
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

    expect(result.ok).toBe(false);
    expect(result).toMatchObject({
      errorKind: "http_error",
      retryHint: "retryable",
      errorMessage: "Generic webhook returned HTTP 500",
    });
    expect(result.responseBody).toBe("down");
  });

  it("renders sent payloads with the same parsed template config as previews", async () => {
    const calls: Array<{ url: string; init: RequestInit }> = [];
    const fetcher: FetchLike = async (url, init) => {
      calls.push({ url, init });
      return {
        ok: true,
        status: 202,
        text: async () => "accepted",
      };
    };

    const result = await genericWebhookSender.send(
      {
        ...input,
        config: {
          ...input.config,
          template: {
            mode: "text",
            text: "  {{event.title}} -> {{destination.name}}  ",
          },
        },
      },
      { fetch: fetcher },
    );
    const body = JSON.parse(calls[0]?.init.body as string) as { message: string };

    expect(body.message).toBe("Checkout API latency high -> Internal relay");
    expect(result.renderedPayload).toMatchObject({
      message: "Checkout API latency high -> Internal relay",
    });
  });
});
