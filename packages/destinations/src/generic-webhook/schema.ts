import { z } from "zod";

import { MessageTemplateSchema } from "#/template.ts";

export const GenericWebhookConfigSchema = z.object({
  url: z.url(),
  method: z.enum(["POST", "PUT", "PATCH"]).default("POST"),
  headers: z.record(z.string(), z.string()).default({}),
  messageTemplate: MessageTemplateSchema,
});

export type GenericWebhookConfig = z.infer<typeof GenericWebhookConfigSchema>;
