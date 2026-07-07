import type { JsonValue } from "@vane/core";

import { DestinationTemplateEngine } from "#/template.ts";
import type { DestinationSendInput } from "#/types.ts";

import type { GenericWebhookConfig } from "#/generic-webhook/schema.ts";

export function renderGenericWebhookPayload(
  input: DestinationSendInput<GenericWebhookConfig>,
): JsonValue {
  return {
    eventId: input.eventId,
    source: {
      id: input.source.id,
      name: input.source.name,
      provider: input.source.provider,
    },
    destination: {
      id: input.destination.id,
      name: input.destination.name,
      kind: input.destination.kind,
    },
    alert: input.normalizedEvent,
    message:
      input.config.template?.mode === "text"
        ? DestinationTemplateEngine.renderTextOrThrow(
            DestinationTemplateEngine.createRenderContext(input),
            input.config.template.text,
          )
        : input.normalizedEvent.message,
  };
}
