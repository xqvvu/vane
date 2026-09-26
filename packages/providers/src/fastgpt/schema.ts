import { z } from "zod";

export const FastgptProviderConfigSchema = z.object({}).default({});

export type FastgptProviderConfig = z.infer<typeof FastgptProviderConfigSchema>;
