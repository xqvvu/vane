import type { JsonObject, JsonValue } from "@vane/core";

import {
  destinationCopy,
  displaySeverity,
  displayStatus,
  formatDestinationDateTime,
} from "#/presentation.ts";
import { DestinationTemplateEngine } from "#/template.ts";
import type { DestinationSendInput } from "#/types.ts";

import type { SlackConfig } from "#/slack/schema.ts";

export function renderSlackPayload(input: DestinationSendInput<SlackConfig>): JsonValue {
  const event = input.normalizedEvent;
  const labels = destinationCopy(input.presentation).labels;
  const severity = displaySeverity(event.severity, input.presentation);
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
    markdownField(labels.severity, severity),
    markdownField(labels.status, displayStatus(event.status, input.presentation)),
    markdownField(labels.source, input.source.name),
    markdownField(labels.fingerprint, event.fingerprint),
    markdownField(
      labels.occurredAt,
      formatDestinationDateTime(event.occurredAt, input.presentation),
    ),
    markdownField(labels.eventId, input.eventId),
  ];

  if (labelText) {
    fields.push(markdownField(labels.labels, labelText));
  }

  return {
    text: `[${severity}] ${event.title}`,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `[${severity}] ${event.title}`,
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
