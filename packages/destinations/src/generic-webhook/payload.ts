import type { JsonValue } from "@vane/core";

import type { GenericWebhookConfig } from "#destinations/generic-webhook/schema";
import { DestinationTemplateEngine } from "#destinations/template";
import type { DestinationSendInput } from "#destinations/types";

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
            "template.text",
            input.config.template.bindings,
          )
        : input.normalizedEvent.message,
  };
}
