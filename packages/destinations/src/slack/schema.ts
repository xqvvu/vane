import { z } from "zod";

import { TextOnlyDestinationTemplateSchema } from "#destinations/template";

export const SlackConfigSchema = z.strictObject({
  webhookUrl: z.url(),
  template: TextOnlyDestinationTemplateSchema.optional(),
});

export type SlackConfig = z.infer<typeof SlackConfigSchema>;
