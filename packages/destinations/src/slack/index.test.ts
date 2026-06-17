import { describe, expect, it } from "vitest";

import { createDefaultDestinationRegistry } from "#/registry.ts";
import { slackSender } from "#/slack/index.ts";
import type { SlackConfig } from "#/slack/index.ts";
import type { DestinationSendInput, FetchLike } from "#/types.ts";

const input: DestinationSendInput<SlackConfig> = {
  eventId: "event-1",
  source: {
    id: "source-1",
    name: "Alertmanager prod",
    provider: "alertmanager",
    enabled: true,
  },
  destination: {
    id: "dest-1",
    name: "Slack SRE",
    kind: "slack",
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
    webhookUrl: "https://hooks.slack.com/services/example",
  },
};

describe("slack sender", () => {
  it("sends block-kit alert payloads through an injected transport", async () => {
    const calls: Array<{ url: string; init: RequestInit }> = [];
    const fetcher: FetchLike = async (url, init) => {
      calls.push({ url, init });
      return {
        ok: true,
        status: 200,
        text: async () => "ok",
      };
    };

    const result = await slackSender.send(input, { fetch: fetcher });

    expect(result.ok).toBe(true);
    expect(result.statusCode).toBe(200);
    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toBe(input.config.webhookUrl);
    expect(calls[0]?.init.headers).toEqual({
      "Content-Type": "application/json",
    });
    const body = JSON.parse(calls[0]?.init.body as string) as {
      text: string;
      blocks: Array<{ type: string }>;
    };
    expect(body.text).toBe("[CRITICAL] Checkout API latency high");
    expect(body.blocks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "header",
        }),
        expect.objectContaining({
          type: "section",
        }),
      ]),
    );
  });

  it("reports non-ok Slack responses as delivery failures", async () => {
    const fetcher: FetchLike = async () => ({
      ok: true,
      status: 200,
      text: async () => "invalid_payload",
    });

    const result = await slackSender.send(input, { fetch: fetcher });

    expect(result.ok).toBe(false);
    expect(result).toMatchObject({
      errorKind: "target_rejected",
      retryHint: "not_retryable",
      errorMessage: "Slack webhook returned invalid_payload",
    });
  });

  it("renders sent payloads with the same parsed template config as previews", async () => {
    const calls: Array<{ url: string; init: RequestInit }> = [];
    const fetcher: FetchLike = async (url, init) => {
      calls.push({ url, init });
      return {
        ok: true,
        status: 200,
        text: async () => "ok",
      };
    };

    const result = await slackSender.send(
      {
        ...input,
        config: {
          webhookUrl: input.config.webhookUrl,
          messageTemplate: "  {{event.title}} -> {{destination.name}}  ",
        },
      },
      { fetch: fetcher },
    );
    const body = JSON.parse(calls[0]?.init.body as string) as {
      blocks: Array<{ type: string; text?: { text: string } }>;
    };
    const messageBlock = body.blocks.find((block) => block.type === "section" && block.text?.text);

    expect(messageBlock?.text?.text).toBe("Checkout API latency high -> Slack SRE");
    expect(result.renderedPayload).toMatchObject({
      blocks: expect.arrayContaining([
        expect.objectContaining({
          type: "section",
          text: expect.objectContaining({
            text: "Checkout API latency high -> Slack SRE",
          }),
        }),
      ]),
    });
  });

  it("registers Slack in the default destination registry", () => {
    const adapter = createDefaultDestinationRegistry().get("slack");

    expect(adapter.manifest.kind).toBe("slack");
  });
});
