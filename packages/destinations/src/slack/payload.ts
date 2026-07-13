import type { JsonObject, JsonValue } from "@vane/core";

import { DestinationTemplateEngine } from "#/template.ts";
import type { DestinationSendInput } from "#/types.ts";

import type { SlackConfig } from "#/slack/schema.ts";

export function renderSlackPayload(input: DestinationSendInput<SlackConfig>): JsonValue {
  const event = input.normalizedEvent;
  const message =
    input.config.template?.mode === "text"
      ? DestinationTemplateEngine.renderTextOrThrow(
          DestinationTemplateEngine.createRenderContext(input),
          input.config.template.text,
          "template.text",
          input.config.template.bindings,
        )
      : event.message;
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
