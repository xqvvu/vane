import { defineProviderAdapter } from "#/types.ts";

import { signozProviderManifest } from "./manifest.ts";
import { parseSignozProviderResult } from "./parse.ts";
import { SignozProviderConfigSchema } from "./schema.ts";

export const signozProviderAdapter = defineProviderAdapter({
  manifest: signozProviderManifest,
  configSchema: SignozProviderConfigSchema,
  parse: parseSignozProviderResult,
});

export const signozProviderParser = signozProviderAdapter;
