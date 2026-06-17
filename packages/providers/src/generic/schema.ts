import { z } from "zod";

export const GenericProviderConfigSchema = z.object({}).default({});

export type GenericProviderConfig = z.infer<typeof GenericProviderConfigSchema>;
