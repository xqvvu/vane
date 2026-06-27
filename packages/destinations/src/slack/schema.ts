import { z } from "zod";

import { TextOnlyDestinationTemplateSchema } from "#/template.ts";

export const SlackConfigSchema = z.strictObject({
  webhookUrl: z.url(),
  template: TextOnlyDestinationTemplateSchema.optional(),
});

export type SlackConfig = z.infer<typeof SlackConfigSchema>;
