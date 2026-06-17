import { z } from "zod";

export const UptimeKumaProviderConfigSchema = z.object({}).default({});

export type UptimeKumaProviderConfig = z.infer<typeof UptimeKumaProviderConfigSchema>;
