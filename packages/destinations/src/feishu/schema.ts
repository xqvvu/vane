import { z } from "zod";

import { DestinationTemplateSchema } from "#/template.ts";

import { defaultFeishuCardTemplate } from "#/feishu/default-card.ts";

export const defaultFeishuTextTemplate =
  "[{{event.severity}}] {{event.title}}\n{{event.message}}\nStatus: {{event.status}}\nSource: {{source.name}}\nFingerprint: {{event.fingerprint}}\nOccurred at: {{event.occurredAt}}\nEvent ID: {{event.id}}";

export const FeishuConfigSchema = z.strictObject({
  webhookUrl: z.url(),
  signSecret: z.string().min(1).optional(),
  template: DestinationTemplateSchema.default({
    mode: "feishu_card",
    card: defaultFeishuCardTemplate,
  }),
});

export type FeishuConfig = z.infer<typeof FeishuConfigSchema>;
