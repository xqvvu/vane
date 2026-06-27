import { z } from "zod";

import { TextOnlyDestinationTemplateSchema } from "#/template.ts";

export const GenericWebhookConfigSchema = z.strictObject({
  url: z.url(),
  method: z.enum(["POST", "PUT", "PATCH"]).default("POST"),
  headers: z.record(z.string(), z.string()).default({}),
  template: TextOnlyDestinationTemplateSchema.optional(),
});

export type GenericWebhookConfig = z.infer<typeof GenericWebhookConfigSchema>;
