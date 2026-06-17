import { z } from "zod";

import { MessageTemplateSchema } from "#/template.ts";

export const SlackConfigSchema = z.object({
  webhookUrl: z.url(),
  messageTemplate: MessageTemplateSchema,
});

export type SlackConfig = z.infer<typeof SlackConfigSchema>;
