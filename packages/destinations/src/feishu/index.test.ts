import { describe, expect, it } from "vitest";

import { createFeishuSign, feishuSender } from "#/feishu/index.ts";
import type { FeishuConfig } from "#/feishu/index.ts";
import { createDefaultDestinationRegistry } from "#/registry.ts";
import type { DestinationSendInput, FetchLike } from "#/types.ts";

const input: DestinationSendInput<FeishuConfig> = {
  eventId: "event-1",
  source: {
    id: "source-1",
    name: "Grafana prod",
    provider: "grafana",
    enabled: true,
  },
  destination: {
    id: "dest-1",
    name: "Feishu SRE",
    kind: "feishu",
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
    webhookUrl: "https://open.feishu.cn/open-apis/bot/v2/hook/example",
    signSecret: "secret",
  },
};

describe("feishu sender", () => {
  it("sends signed text messages through an injected transport", async () => {
    const calls: Array<{ url: string; init: RequestInit }> = [];
    const fetcher: FetchLike = async (url, init) => {
      calls.push({ url, init });
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ code: 0, msg: "success" }),
      };
    };

    const result = await feishuSender.send(input, {
      fetch: fetcher,
      now: () => new Date("2024-03-09T16:00:00.000Z"),
    });

    expect(result.ok).toBe(true);
    expect(result.statusCode).toBe(200);
    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toBe(input.config.webhookUrl);
    expect(calls[0]?.init.headers).toEqual({
      "Content-Type": "application/json",
    });
    const body = JSON.parse(calls[0]?.init.body as string) as {
      msg_type: string;
      content: { text: string };
      timestamp: string;
      sign: string;
    };
    expect(body.msg_type).toBe("text");
    expect(body.timestamp).toBe("1710000000");
    expect(body.content.text).toContain("[CRITICAL] Checkout API latency high");
    expect(body.content.text).toContain("Labels: service=checkout");
    await expect(createFeishuSign(body.timestamp, "secret")).resolves.toBe(body.sign);
    expect(result.renderedPayload).toEqual({
      msg_type: "text",
      content: {
        text: expect.stringContaining("[CRITICAL] Checkout API latency high"),
      },
    });
    expect(JSON.stringify(result.renderedPayload)).not.toContain("secret");
    expect(result.renderedPayload).not.toHaveProperty("timestamp");
    expect(result.renderedPayload).not.toHaveProperty("sign");
  });

  it("reports Feishu error codes as delivery failures", async () => {
    const fetcher: FetchLike = async () => ({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ code: 19024, msg: "invalid sign" }),
    });

    const result = await feishuSender.send(input, { fetch: fetcher });

    expect(result.ok).toBe(false);
    expect(result).toMatchObject({
      errorKind: "target_rejected",
      retryHint: "not_retryable",
      errorMessage: "Feishu returned code 19024",
    });
  });

  it("creates signatures with Feishu's timestamp and secret format", () => {
    const expected = "jWsBkWnzlRKtaP+iZgwraSojMWik4cJR7aysApQZuoA=";

    return expect(createFeishuSign("1710000000", "secret")).resolves.toBe(expected);
  });

  it("registers Feishu in the default destination registry", () => {
    const adapter = createDefaultDestinationRegistry().get("feishu");

    expect(adapter.manifest.kind).toBe("feishu");
  });
});
