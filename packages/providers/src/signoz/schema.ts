import { z } from "zod";

export const SignozProviderConfigSchema = z.object({}).default({});

export type SignozProviderConfig = z.infer<typeof SignozProviderConfigSchema>;
