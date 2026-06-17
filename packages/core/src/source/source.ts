import { z } from "zod";

export const SourceProviderSchema = z.enum([
  "generic",
  "signoz",
  "grafana",
  "uptime_kuma",
  "alertmanager",
]);
export type SourceProvider = z.infer<typeof SourceProviderSchema>;

export const SourceSummarySchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1),
  provider: SourceProviderSchema,
  enabled: z.boolean(),
});

export type SourceSummary = z.infer<typeof SourceSummarySchema>;
