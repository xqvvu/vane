import { z } from "zod";

export const DestinationKindSchema = z.enum(["generic_webhook", "feishu", "slack", "email"]);
export type DestinationKind = z.infer<typeof DestinationKindSchema>;

export const DestinationSummarySchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1),
  kind: DestinationKindSchema,
  enabled: z.boolean(),
});

export type DestinationSummary = z.infer<typeof DestinationSummarySchema>;
