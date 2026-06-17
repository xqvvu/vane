import { z } from "zod";

import { MessageTemplateSchema } from "#/template.ts";

export const FeishuConfigSchema = z.object({
  webhookUrl: z.url(),
  signSecret: z.string().min(1).optional(),
  messageTemplate: MessageTemplateSchema,
});

export type FeishuConfig = z.infer<typeof FeishuConfigSchema>;
