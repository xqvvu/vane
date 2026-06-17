import { z } from "zod";

export const AlertmanagerProviderConfigSchema = z.object({}).default({});

export type AlertmanagerProviderConfig = z.infer<typeof AlertmanagerProviderConfigSchema>;
