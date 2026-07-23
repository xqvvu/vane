import { Adapter } from "#providers/utils";

import { signozProviderManifest } from "#providers/signoz/manifest";
import { parseSignozProviderResult } from "#providers/signoz/parse";
import { SignozProviderConfigSchema } from "#providers/signoz/schema";

export const signozProviderAdapter = Adapter.define({
  manifest: signozProviderManifest,
  configSchema: SignozProviderConfigSchema,
  parse: parseSignozProviderResult,
});

export const signozProviderParser = signozProviderAdapter;
