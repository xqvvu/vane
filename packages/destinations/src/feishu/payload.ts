import type { JsonObject, JsonValue } from "@vane/core";

import { renderMessageTemplate } from "#/template.ts";
import type { DestinationSendInput } from "#/types.ts";

import type { FeishuConfig } from "./schema.ts";
import { createFeishuSign } from "./signing.ts";

export function renderFeishuPreviewPayload(
  input: DestinationSendInput<FeishuConfig>,
  config: FeishuConfig,
): JsonValue {
  return {
    msg_type: "text",
    content: {
      text: renderFeishuText(input, config),
    },
  };
}

export async function renderFeishuWirePayload(
  input: DestinationSendInput<FeishuConfig>,
  config: FeishuConfig,
  now: () => Date = () => new Date(),
): Promise<JsonValue> {
  const payload = renderFeishuPreviewPayload(input, config) as JsonObject;

  if (config.signSecret) {
    const timestamp = Math.floor(now().valueOf() / 1000).toString();
    payload.timestamp = timestamp;
    payload.sign = await createFeishuSign(timestamp, config.signSecret);
  }

  return payload;
}

function renderFeishuText(input: DestinationSendInput<FeishuConfig>, config: FeishuConfig): string {
  const event = input.normalizedEvent;
  const templated = renderMessageTemplate(input, config.messageTemplate);

  if (templated) {
    return templated;
  }

  const labelText = Object.entries(event.labels)
    .map(([key, value]) => `${key}=${value}`)
    .join(", ");

  return [
    `[${event.severity.toUpperCase()}] ${event.title}`,
    event.message,
    `Status: ${event.status}`,
    `Source: ${input.source.name}`,
    labelText ? `Labels: ${labelText}` : null,
    `Fingerprint: ${event.fingerprint}`,
    `Occurred at: ${event.occurredAt}`,
    `Event ID: ${input.eventId}`,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
}
