import type { JsonObject, JsonValue } from "@vane/core";

import {
  assertValidJsonTemplate,
  createTemplateContext,
  renderJsonTemplate,
  renderTextTemplate,
  TemplateValidationError,
} from "#/template.ts";
import type { DestinationSendInput } from "#/types.ts";

import type { FeishuConfig } from "./schema.ts";
import { createFeishuSign } from "./signing.ts";

export function renderFeishuPreviewPayload(
  input: DestinationSendInput<FeishuConfig>,
  config: FeishuConfig,
): JsonValue {
  const context = createTemplateContext(input);

  if (config.template.mode === "feishu_card") {
    assertValidJsonTemplate(config.template.card, "template.card");

    const rendered = renderJsonTemplate(context, config.template.card, "template.card");

    if (!rendered.ok) {
      throw new TemplateValidationError(rendered.diagnostics);
    }

    return {
      msg_type: "interactive",
      card: rendered.value,
    };
  }

  const rendered = renderTextTemplate(context, config.template.text, "template.text");

  if (!rendered.ok) {
    throw new TemplateValidationError(rendered.diagnostics);
  }

  return {
    msg_type: "text",
    content: {
      text: rendered.value,
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
