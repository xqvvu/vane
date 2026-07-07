import { describe, expect, it } from "vitest";

import {
  createFeishuSign,
  defaultFeishuCardTemplate,
  FeishuConfigSchema,
  feishuSender,
} from "#/feishu/index.ts";
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
    template: {
      mode: "text",
      text: "[{{event.severity}}] {{event.title}}\n{{event.message}}\nStatus: {{event.status}}",
    },
  },
};

describe("feishu sender", () => {
  it("uses a typed Feishu card as the default template", async () => {
    const config = FeishuConfigSchema.parse({
      webhookUrl: "https://open.feishu.cn/open-apis/bot/v2/hook/example",
    });

    expect(config.template).toEqual({
      mode: "feishu_card",
      card: defaultFeishuCardTemplate,
    });

    const preview = await feishuSender.preview({
      ...input,
      config,
    });

    expect(preview).toMatchObject({
      msg_type: "interactive",
      card: {
        schema: "2.0",
        config: {
          width_mode: "fill",
          summary: {
            content: "[critical] Checkout API latency high",
          },
        },
        header: {
          template: "red",
          title: {
            content: "Checkout API latency high",
          },
        },
      },
    });
    expect(JSON.stringify(preview)).toContain("告警摘要");
    expect(JSON.stringify(preview)).toContain("p95 latency exceeded");
    expect(JSON.stringify(preview)).toContain("服务");
    expect(JSON.stringify(preview)).toContain("checkout");
    expect(JSON.stringify(preview)).not.toContain("secret");
  });

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
    expect(body.content.text).toContain("[critical] Checkout API latency high");
    expect(body.content.text).toContain("Status: firing");
    await expect(createFeishuSign(body.timestamp, "secret")).resolves.toBe(body.sign);
    expect(result.renderedPayload).toEqual({
      msg_type: "text",
      content: {
        text: expect.stringContaining("[critical] Checkout API latency high"),
      },
    });
    expect(JSON.stringify(result.renderedPayload)).not.toContain("secret");
    expect(result.renderedPayload).not.toHaveProperty("timestamp");
    expect(result.renderedPayload).not.toHaveProperty("sign");
  });

  it("renders Feishu interactive card templates without signing fields in rendered payload", async () => {
    const calls: Array<{ url: string; init: RequestInit }> = [];
    const fetcher: FetchLike = async (url, init) => {
      calls.push({ url, init });
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ code: 0, msg: "success" }),
      };
    };

    const result = await feishuSender.send(
      {
        ...input,
        config: {
          ...input.config,
          template: {
            mode: "feishu_card",
            card: {
              header: {
                title: {
                  tag: "plain_text",
                  content: "[{{event.severity}}] {{event.title}}",
                },
              },
              elements: [
                {
                  tag: "div",
                  text: {
                    tag: "lark_md",
                    content: "{{event.message}}\nservice={{event.labels.service}}",
                  },
                },
              ],
            },
          },
        },
      },
      {
        fetch: fetcher,
        now: () => new Date("2024-03-09T16:00:00.000Z"),
      },
    );

    expect(result.ok).toBe(true);
    expect(result.renderedPayload).toEqual({
      msg_type: "interactive",
      card: {
        header: {
          title: {
            tag: "plain_text",
            content: "[critical] Checkout API latency high",
          },
        },
        elements: [
          {
            tag: "div",
            text: {
              tag: "lark_md",
              content: "p95 latency exceeded\nservice=checkout",
            },
          },
        ],
      },
    });

    const body = JSON.parse(calls[0]?.init.body as string) as {
      msg_type: string;
      timestamp: string;
      sign: string;
    };
    expect(body.msg_type).toBe("interactive");
    expect(body.timestamp).toBe("1710000000");
    expect(result.renderedPayload).not.toHaveProperty("timestamp");
    expect(result.renderedPayload).not.toHaveProperty("sign");
  });

  it("reports template validation failures as non-retryable configuration errors", async () => {
    const fetcher: FetchLike = async () => {
      throw new Error("fetch should not be called");
    };

    const result = await feishuSender.send(
      {
        ...input,
        config: {
          ...input.config,
          template: {
            mode: "text",
            text: "{{raw.secret}}",
          },
        },
      },
      { fetch: fetcher },
    );

    expect(result).toMatchObject({
      ok: false,
      errorKind: "configuration_error",
      retryHint: "not_retryable",
      statusCode: null,
      responseBody: null,
      renderedPayload: {
        templateError: {
          diagnostics: [
            {
              severity: "error",
              path: "template.text",
              variable: "raw.secret",
            },
          ],
        },
      },
    });
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
