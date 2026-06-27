import { describe, expect, it } from "vitest";

import { feishuSender } from "#/feishu/index.ts";
import {
  createTemplateContext,
  renderJsonTemplate,
  renderTextTemplate,
  templateDiagnostics,
} from "#/template.ts";
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

describe("destination templates", () => {
  it("interpolates allow-listed event, source, destination, Vane URL, and label fields", () => {
    const context = createTemplateContext(input, {
      eventUrl: "https://vane.example.test/events/event-1",
    });

    expect(
      renderTextTemplate(
        context,
        "{{event.severity}} {{event.title}} service={{event.labels.service}} source={{source.name}} url={{vane.eventUrl}}",
      ),
    ).toEqual({
      ok: true,
      value:
        "critical Checkout API latency high service=checkout source=Grafana prod url=https://vane.example.test/events/event-1",
      diagnostics: [],
    });
  });

  it("rejects unknown variables with path-level diagnostics", () => {
    expect(templateDiagnostics("{{event.title.toUpperCase}} {{process.env.SECRET}}")).toEqual([
      {
        severity: "error",
        path: "template",
        variable: "event.title.toUpperCase",
        message: "Destination template contains unknown variable: event.title.toUpperCase",
      },
      {
        severity: "error",
        path: "template",
        variable: "process.env.SECRET",
        message: "Destination template contains unknown variable: process.env.SECRET",
      },
    ]);
  });

  it("renders missing allow-listed labels as empty strings", () => {
    const context = createTemplateContext(input);

    expect(
      renderTextTemplate(context, "service={{event.labels.service}} pod={{event.labels.pod}}"),
    ).toMatchObject({
      ok: true,
      value: "service=checkout pod=",
    });
  });

  it("recursively renders JSON string fields", () => {
    const context = createTemplateContext(input);

    expect(
      renderJsonTemplate(context, {
        header: {
          title: "{{event.title}}",
        },
        elements: [{ text: "service={{event.labels.service}}" }],
      }),
    ).toEqual({
      ok: true,
      value: {
        header: {
          title: "Checkout API latency high",
        },
        elements: [{ text: "service=checkout" }],
      },
      diagnostics: [],
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
        template: {
          mode: "text",
          text: "{{event.title}}",
        },
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
