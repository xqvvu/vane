import type { JsonObject, JsonValue } from "@vane/core";
import { z } from "zod";

import { MessageTemplateSchema, renderMessageTemplate } from "#/template.ts";
import type { DestinationSendInput, DestinationSender, FetchLike } from "#/types.ts";

export const SlackConfigSchema = z.object({
  webhookUrl: z.url(),
  messageTemplate: MessageTemplateSchema,
});

export type SlackConfig = z.infer<typeof SlackConfigSchema>;

export const slackSender: DestinationSender<SlackConfig> = {
  kind: "slack",
  configSchema: SlackConfigSchema,
  preview(input) {
    const config = SlackConfigSchema.parse(input.config);

    return renderSlackPayload({ ...input, config });
  },
  async send(input, context) {
    const config = SlackConfigSchema.parse(input.config);
    const fetcher = context?.fetch ?? getGlobalFetch();
    const renderedPayload = renderSlackPayload({ ...input, config });
    const response = await fetcher(config.webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(renderedPayload),
    });
    const responseBody = await readResponseBody(response);
    const success = response.ok && responseBody.trim().toLocaleLowerCase() === "ok";

    return {
      success,
      statusCode: response.status,
      responseBody,
      error: success
        ? null
        : response.ok
          ? `Slack webhook returned ${responseBody || "an unexpected response"}`
          : `Slack webhook returned HTTP ${response.status}`,
      renderedPayload,
    };
  },
};

export function renderSlackPayload(input: DestinationSendInput<SlackConfig>): JsonValue {
  const event = input.normalizedEvent;
  const message = renderMessageTemplate(input, input.config.messageTemplate) ?? event.message;
  const labelText = Object.entries(event.labels)
    .map(([key, value]) => `${key}=${value}`)
    .join(", ");
  const fields: JsonObject[] = [
    markdownField("Severity", event.severity),
    markdownField("Status", event.status),
    markdownField("Source", input.source.name),
    markdownField("Fingerprint", event.fingerprint),
    markdownField("Occurred at", event.occurredAt),
    markdownField("Event ID", input.eventId),
  ];

  if (labelText) {
    fields.push(markdownField("Labels", labelText));
  }

  return {
    text: `[${event.severity.toUpperCase()}] ${event.title}`,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `[${event.severity.toUpperCase()}] ${event.title}`,
          emoji: true,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: message,
        },
      },
      {
        type: "section",
        fields,
      },
    ],
  };
}

function markdownField(label: string, value: string): JsonObject {
  return {
    type: "mrkdwn",
    text: `*${label}:*\n${value}`,
  };
}

function getGlobalFetch(): FetchLike {
  if (!globalThis.fetch) {
    throw new Error("No fetch implementation is available for Slack delivery");
  }

  return globalThis.fetch;
}

async function readResponseBody(response: { text(): Promise<string> }): Promise<string> {
  try {
    return await response.text();
  } catch {
    return "";
  }
}
