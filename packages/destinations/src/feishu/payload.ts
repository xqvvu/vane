import type { JsonObject, JsonValue } from "@vane/core";

import { DestinationTemplateEngine } from "#/template.ts";
import { resolveDestinationPresentation } from "#/presentation.ts";
import {
  defaultFeishuCardTemplateForLocale,
  isBuiltInFeishuCardTemplate,
} from "#/feishu/default-card.ts";
import type { DestinationSendInput } from "#/types.ts";

import type { FeishuConfig } from "#/feishu/schema.ts";
import { createFeishuSign } from "#/feishu/signing.ts";

export function renderFeishuPreviewPayload(
  input: DestinationSendInput<FeishuConfig>,
  config: FeishuConfig,
): JsonValue {
  const context = DestinationTemplateEngine.createRenderContext(input);

  if (config.template.mode === "feishu_card") {
    const card = isBuiltInFeishuCardTemplate(config.template.card)
      ? defaultFeishuCardTemplateForLocale(
          resolveDestinationPresentation(input.presentation).locale,
        )
      : config.template.card;

    return {
      msg_type: "interactive",
      card: DestinationTemplateEngine.renderJsonOrThrow(
        context,
        card,
        "template.card",
        config.template.bindings,
      ),
    };
  }

  return {
    msg_type: "text",
    content: {
      text: DestinationTemplateEngine.renderTextOrThrow(
        context,
        config.template.text,
        "template.text",
        config.template.bindings,
      ),
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
