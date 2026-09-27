import { signozProviderManifest } from "#providers/signoz/manifest";
import { parseSignozProviderResult } from "#providers/signoz/parse";
import { SignozProviderConfigSchema } from "#providers/signoz/schema";
import { Adapter } from "#providers/utils";

export const signozProviderAdapter = Adapter.define({
  manifest: signozProviderManifest,
  configSchema: SignozProviderConfigSchema,
  parse: parseSignozProviderResult,
});

export const signozProviderParser = signozProviderAdapter;
