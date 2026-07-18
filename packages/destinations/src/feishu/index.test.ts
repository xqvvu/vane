import { describe, expect, it } from "vitest";

import signozTemplate from "../../../../examples/feishu/signoz-template.json" with { type: "json" };
import uptimeKumaTemplate from "../../../../examples/feishu/uptime-kuma-template.json" with { type: "json" };

import {
  createFeishuSign,
  defaultFeishuCardBindings,
  defaultFeishuCardTemplate,
  BUILT_IN_FEISHU_ALERT_CARD_ID,
  BUILT_IN_FEISHU_ALERT_CARD_VERSION,
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
      source: "custom",
      mode: "text",
      text: "[{{event.severity}}] {{event.title}}\n{{event.message}}\nStatus: {{event.status}}",
    },
  },
};

describe("feishu sender", () => {
  it("renders the SigNoz example with alert context, dotted keys, and action links", async () => {
    const ruleUrl =
      "https://signoz.example.test/alerts/edit?ruleId=019ebfb1-c154-7b40-bcbd-cc841780b3ad";
    const logsUrl = "https://signoz.example.test/logs/logs-explorer?query=llm-response-empty";
    const config = FeishuConfigSchema.parse({
      webhookUrl: "https://open.feishu.cn/open-apis/bot/v2/hook/example",
      template: {
        mode: "feishu_card",
        card: signozTemplate,
        bindings: defaultFeishuCardBindings,
      },
    });

    const preview = await feishuSender.preview({
      ...input,
      source: {
        ...input.source,
        name: "SigNoz prod",
        provider: "signoz",
      },
      normalizedEvent: {
        ...input.normalizedEvent,
        title: "LLM empty response",
        message: "LLM returned an empty response 3 times in a row",
        severity: "critical",
        status: "firing",
        fingerprint: "d23d1e1ec71befd6",
      },
      payload: {
        status: "firing",
        commonLabels: {
          alertname: "LLM empty response",
          core: "model",
          ruleId: "019ebfb1-c154-7b40-bcbd-cc841780b3ad",
          ruleSource: ruleUrl,
          severity: "critical",
          "threshold.name": "critical",
        },
        commonAnnotations: {
          description: "LLM returned an empty response 3 times in a row",
          related_logs: logsUrl,
          summary: "LLM empty responses are occurring frequently",
        },
        alerts: [
          {
            startsAt: "2026-07-06T07:39:07.585456709Z",
            fingerprint: "d23d1e1ec71befd6",
          },
        ],
      },
      config,
      presentation: { locale: "en-US", timeZone: "Asia/Shanghai" },
    });
    const serialized = JSON.stringify(preview);

    expect(preview).toMatchObject({
      msg_type: "interactive",
      card: {
        header: {
          template: "red",
          title: { content: "LLM empty response" },
          text_tag_list: [{ color: "red" }, { color: "grey" }],
        },
      },
    });
    expect(serialized).toContain("model");
    expect(serialized).toContain("Threshold: critical");
    expect(serialized).toContain(ruleUrl);
    expect(serialized).toContain(logsUrl);
    expect(serialized).not.toContain("authorization");
    expect(serialized).not.toContain("x-forwarded-for");
  });

  it("renders the Uptime Kuma example with operational details and no request headers", async () => {
    const config = FeishuConfigSchema.parse({
      webhookUrl: "https://open.feishu.cn/open-apis/bot/v2/hook/example",
      template: {
        mode: "feishu_card",
        card: uptimeKumaTemplate,
        bindings: defaultFeishuCardBindings,
      },
    });

    const preview = await feishuSender.preview({
      ...input,
      source: {
        ...input.source,
        name: "Uptime Kuma prod",
        provider: "uptime_kuma",
      },
      normalizedEvent: {
        ...input.normalizedEvent,
        title: "Login page is resolved",
        message: "[Login page] [Up] 200 - OK",
        severity: "info",
        status: "resolved",
        fingerprint: "uptime_kuma:20",
        labels: {
          provider: "uptime_kuma",
          monitor: "Login page",
          monitor_id: "20",
          monitor_path: "Services / Primary / Login page",
          url: "https://status.example.test/login",
          type: "http",
          response_time_ms: "75",
          last_down_at: "2026-07-14 09:52:34.195",
        },
      },
      payload: {
        heartbeat: {
          ping: 75,
          lastDownTime: "2026-07-14 09:52:34.195",
        },
        monitor: {
          id: 20,
          name: "Login page",
          pathName: "Services / Primary / Login page",
          url: "https://status.example.test/login",
          type: "http",
        },
      },
      config,
      presentation: { locale: "en-US", timeZone: "Asia/Shanghai" },
    });
    const serialized = JSON.stringify(preview);

    expect(preview).toMatchObject({
      msg_type: "interactive",
      card: {
        header: {
          template: "green",
          title: { content: "Login page" },
        },
      },
    });
    expect(serialized).toContain("75 ms");
    expect(serialized).toContain("Services / Primary / Login page");
    expect(serialized).not.toContain("authorization");
    expect(serialized).not.toContain("x-forwarded-for");
  });

  it.each([
    ["SigNoz", signozTemplate, "Detailed description", "详细描述"],
    ["Uptime Kuma", uptimeKumaTemplate, "Check result", "检查结果"],
  ] as const)("localizes the %s example from presentation settings", async (_, card, en, zh) => {
    const config = FeishuConfigSchema.parse({
      webhookUrl: "https://open.feishu.cn/open-apis/bot/v2/hook/example",
      template: {
        mode: "feishu_card",
        card,
        bindings: defaultFeishuCardBindings,
      },
    });
    const render = (locale: "en-US" | "zh-Hans") =>
      feishuSender.preview({
        ...input,
        payload: {},
        config,
        presentation: { locale, timeZone: "UTC" },
      });

    expect(JSON.stringify(await render("en-US"))).toContain(en);
    expect(JSON.stringify(await render("zh-Hans"))).toContain(zh);
  });

  it("uses a typed Feishu card as the default template", async () => {
    const config = FeishuConfigSchema.parse({
      webhookUrl: "https://open.feishu.cn/open-apis/bot/v2/hook/example",
    });

    expect(config.template).toEqual({
      source: "builtin",
      id: BUILT_IN_FEISHU_ALERT_CARD_ID,
      version: BUILT_IN_FEISHU_ALERT_CARD_VERSION,
      bindings: defaultFeishuCardBindings,
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
          width_mode: "compact",
          summary: {
            content: "[Firing] [Critical] Checkout API latency high",
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
    expect(JSON.stringify(preview)).toContain("Alert summary");
    expect(JSON.stringify(preview)).toContain("p95 latency exceeded");
    expect(JSON.stringify(preview)).not.toContain("Service");
    expect(JSON.stringify(preview)).not.toContain("Environment");
    expect(JSON.stringify(preview)).not.toContain("secret");
  });

  it("localizes the default card and timestamp with instance presentation settings", async () => {
    const config = FeishuConfigSchema.parse({
      webhookUrl: "https://open.feishu.cn/open-apis/bot/v2/hook/example",
    });
    const preview = await feishuSender.preview({
      ...input,
      config,
      presentation: { locale: "zh-Hans", timeZone: "Asia/Shanghai" },
    });
    const serialized = JSON.stringify(preview);

    expect(serialized).toContain("告警摘要");
    expect(serialized).toContain("严重");
    expect(serialized).toContain("2026年6月7日 16:00:00");
    expect(serialized).not.toContain("**服务**");
  });

  it("upgrades the legacy built-in card to the configured presentation locale", async () => {
    const legacyDefault = JSON.parse(
      JSON.stringify(defaultFeishuCardTemplate)
        .replaceAll("{{presentation.labels.summary}}", "告警摘要")
        .replaceAll("{{presentation.labels.status}}", "状态")
        .replaceAll("{{presentation.labels.source}}", "告警源")
        .replaceAll("{{presentation.labels.severity}}", "级别")
        .replaceAll("{{presentation.labels.provider}}", "上游系统")
        .replaceAll("{{presentation.labels.fingerprint}}", "指纹")
        .replaceAll("{{presentation.labels.eventId}}", "事件 ID")
        .replaceAll("{{presentation.labels.destination}}", "通知目标"),
    );
    const config = FeishuConfigSchema.parse({
      webhookUrl: "https://open.feishu.cn/open-apis/bot/v2/hook/example",
      template: {
        mode: "feishu_card",
        card: legacyDefault,
        bindings: defaultFeishuCardBindings,
      },
    });
    expect(config.template).toMatchObject({
      source: "builtin",
      id: BUILT_IN_FEISHU_ALERT_CARD_ID,
      version: BUILT_IN_FEISHU_ALERT_CARD_VERSION,
    });
    const preview = await feishuSender.preview({
      ...input,
      config,
      presentation: { locale: "en-US", timeZone: "UTC" },
    });
    const serialized = JSON.stringify(preview);

    expect(serialized).toContain("Alert summary");
    expect(serialized).toContain("Critical");
    expect(serialized).not.toContain("告警摘要");
  });

  it.each([
    ["firing", "red"],
    ["resolved", "green"],
    ["unknown", "grey"],
  ] as const)("renders the default %s card with a %s header", async (status, color) => {
    const config = FeishuConfigSchema.parse({
      webhookUrl: "https://open.feishu.cn/open-apis/bot/v2/hook/example",
    });
    const preview = await feishuSender.preview({
      ...input,
      normalizedEvent: {
        ...input.normalizedEvent,
        status,
      },
      config,
    });

    expect(preview).toMatchObject({
      msg_type: "interactive",
      card: {
        header: {
          template: color,
          text_tag_list: [
            expect.anything(),
            {
              color,
            },
          ],
        },
      },
    });
  });

  it("rejects unsupported values used by Feishu color bindings", () => {
    expect(() =>
      FeishuConfigSchema.parse({
        webhookUrl: "https://open.feishu.cn/open-apis/bot/v2/hook/example",
        template: {
          mode: "feishu_card",
          bindings: {
            statusColor: {
              select: "event.status",
              cases: { firing: "chartreuse" },
              fallback: "grey",
            },
          },
          card: {
            header: {
              template: "{{bindings.statusColor}}",
            },
          },
        },
      }),
    ).toThrow(/unsupported color: chartreuse/);
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
            source: "custom",
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
            source: "custom",
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
