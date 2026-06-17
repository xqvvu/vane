import { z } from "zod";

export const GrafanaProviderConfigSchema = z.object({}).default({});

export type GrafanaProviderConfig = z.infer<typeof GrafanaProviderConfigSchema>;
