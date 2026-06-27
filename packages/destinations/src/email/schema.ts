import { z } from "zod";

import { TextOnlyDestinationTemplateSchema } from "#/template.ts";

export const EmailConfigSchema = z.strictObject({
  endpointUrl: z.url(),
  to: z.array(z.email()).min(1),
  from: z.email(),
  replyTo: z.email().optional(),
  subjectPrefix: z.string().trim().optional(),
  headers: z.record(z.string(), z.string()).default({}),
  template: TextOnlyDestinationTemplateSchema.optional(),
});

export type EmailConfig = z.infer<typeof EmailConfigSchema>;
