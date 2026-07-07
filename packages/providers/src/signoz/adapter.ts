import { Adapter } from "#/utils.ts";

import { signozProviderManifest } from "#/signoz/manifest.ts";
import { parseSignozProviderResult } from "#/signoz/parse.ts";
import { SignozProviderConfigSchema } from "#/signoz/schema.ts";

export const signozProviderAdapter = Adapter.define({
  manifest: signozProviderManifest,
  configSchema: SignozProviderConfigSchema,
  parse: parseSignozProviderResult,
});

export const signozProviderParser = signozProviderAdapter;
