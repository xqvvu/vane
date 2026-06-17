import { describe, expect, it } from "vitest";

import { feishuSender } from "#/feishu/index.ts";
import { genericWebhookSender } from "#/generic-webhook/index.ts";
import { MessageTemplateSchema, renderMessageTemplate } from "#/template.ts";
import type { DestinationSendInput } from "#/types.ts";

const input: DestinationSendInput<unknown> = {
  eventId: "event-1",
  source: {
    id: "source-1",
    name: "Grafana prod",
    provider: "grafana",
    enabled: true,
  },
  destination: {
    id: "dest-1",
    name: "Ops destination",
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
  config: {},
};

describe("message templates", () => {
  it("interpolates allow-listed alert, source, destination, and label fields", () => {
    expect(
      renderMessageTemplate(
        input,
        "{{event.severity}} {{event.title}} service={{event.labels.service}} source={{source.name}}",
      ),
    ).toBe("critical Checkout API latency high service=checkout source=Grafana prod");
  });

  it("rejects unknown variables before rendering destination payloads", () => {
    expect(() =>
      MessageTemplateSchema.parse("{{event.title.toUpperCase}} {{process.env.SECRET}}"),
    ).toThrow("Message template contains unknown variables");
    expect(() =>
      genericWebhookSender.preview({
        ...input,
        config: {
          url: "https://relay.example.test/vane",
          method: "POST",
          headers: {},
          messageTemplate: "{{event.title.toUpperCase}}",
        },
      }),
    ).toThrow("Message template contains unknown variables");
  });

  it("renders missing allow-listed labels as empty strings", () => {
    expect(
      renderMessageTemplate(input, "service={{event.labels.service}} pod={{event.labels.pod}}"),
    ).toBe("service=checkout pod=");
  });

  it("renders generic webhook previews with templated messages", async () => {
    const preview = await genericWebhookSender.preview({
      ...input,
      config: {
        url: "https://relay.example.test/vane",
        method: "POST",
        headers: {},
        messageTemplate: "{{event.title}} -> {{destination.name}}",
      },
    });

    expect(preview).toMatchObject({
      message: "Checkout API latency high -> Ops destination",
    });
  });

  it("omits Feishu signing fields from previews", async () => {
    const preview = await feishuSender.preview({
      ...input,
      destination: {
        ...input.destination,
        kind: "feishu",
      },
      config: {
        webhookUrl: "https://open.feishu.cn/open-apis/bot/v2/hook/example",
        signSecret: "secret",
        messageTemplate: "{{event.title}}",
      },
    });

    expect(preview).toEqual({
      msg_type: "text",
      content: {
        text: "Checkout API latency high",
      },
    });
  });
});
