import { z } from "zod";

import { DestinationTemplateSchema, TemplateBindingsSchema } from "#destinations/template";

import { defaultFeishuCardBindings, FeishuCardColors } from "#destinations/feishu/appearance";
import {
  BUILT_IN_FEISHU_ALERT_CARD_ID,
  BUILT_IN_FEISHU_ALERT_CARD_VERSION,
  resolveBuiltInFeishuCardTemplate,
} from "#destinations/feishu/default-card";

const FeishuCardColorSet: ReadonlySet<string> = new Set(FeishuCardColors);

export const BuiltInFeishuDestinationTemplateSchema = z.strictObject({
  source: z.literal("builtin"),
  id: z.literal(BUILT_IN_FEISHU_ALERT_CARD_ID),
  version: z.literal(BUILT_IN_FEISHU_ALERT_CARD_VERSION),
  bindings: TemplateBindingsSchema.optional(),
});

const FeishuDestinationTemplateSchema = z
  .union([BuiltInFeishuDestinationTemplateSchema, DestinationTemplateSchema])
  .transform((template) => {
    if (template.source === "builtin") {
      return template;
    }

    return { ...template, source: "custom" as const };
  })
  .superRefine((template, context) => {
    const card =
      template.source === "builtin"
        ? resolveBuiltInFeishuCardTemplate(template)
        : template.mode === "feishu_card"
          ? template.card
          : null;

    if (!card) {
      return;
    }

    for (const bindingName of feishuColorBindingNames(card)) {
      const binding = template.bindings?.[bindingName];

      if (!binding) {
        continue;
      }

      for (const [caseName, value] of Object.entries(binding.cases)) {
        if (!FeishuCardColorSet.has(value)) {
          context.addIssue({
            code: "custom",
            path: ["bindings", bindingName, "cases", caseName],
            message: `Feishu card color binding contains unsupported color: ${value}`,
          });
        }
      }

      if (!FeishuCardColorSet.has(binding.fallback)) {
        context.addIssue({
          code: "custom",
          path: ["bindings", bindingName, "fallback"],
          message: `Feishu card color binding contains unsupported color: ${binding.fallback}`,
        });
      }
    }
  });

export const defaultFeishuTextTemplate =
  "[{{event.severity}}] {{event.title}}\n{{event.message}}\nStatus: {{event.status}}\nSource: {{source.name}}\nFingerprint: {{event.fingerprint}}\nOccurred at: {{event.occurredAt}}\nEvent ID: {{event.id}}";

export const FeishuConfigSchema = z.strictObject({
  webhookUrl: z.url(),
  signSecret: z.string().min(1).optional(),
  template: FeishuDestinationTemplateSchema.default({
    source: "builtin",
    id: BUILT_IN_FEISHU_ALERT_CARD_ID,
    version: BUILT_IN_FEISHU_ALERT_CARD_VERSION,
    bindings: defaultFeishuCardBindings,
  }),
});

export type FeishuConfig = z.infer<typeof FeishuConfigSchema>;

function feishuColorBindingNames(card: Record<string, unknown>): Set<string> {
  const names = new Set<string>();
  const header = jsonRecord(card.header);

  addBindingName(names, header?.template);

  if (Array.isArray(header?.text_tag_list)) {
    for (const tag of header.text_tag_list) {
      addBindingName(names, jsonRecord(tag)?.color);
    }
  }

  return names;
}

function addBindingName(names: Set<string>, value: unknown): void {
  if (typeof value !== "string") {
    return;
  }

  const match = /^\{\{\s*bindings\.([a-zA-Z][a-zA-Z0-9_-]{0,63})\s*\}\}$/.exec(value);

  if (match) {
    names.add(match[1]!);
  }
}

function jsonRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}
