import { z } from "zod";

import { DestinationTemplateSchema } from "#/template.ts";

export const defaultFeishuTextTemplate =
  "[{{event.severity}}] {{event.title}}\n{{event.message}}\nStatus: {{event.status}}\nSource: {{source.name}}\nFingerprint: {{event.fingerprint}}\nOccurred at: {{event.occurredAt}}\nEvent ID: {{event.id}}";

export const FeishuConfigSchema = z.strictObject({
  webhookUrl: z.url(),
  signSecret: z.string().min(1).optional(),
  template: DestinationTemplateSchema.default({
    mode: "text",
    text: defaultFeishuTextTemplate,
  }),
});

export type FeishuConfig = z.infer<typeof FeishuConfigSchema>;
