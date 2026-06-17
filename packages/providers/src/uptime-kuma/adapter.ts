import { defineProviderAdapter } from "#/types.ts";

import { uptimeKumaProviderManifest } from "./manifest.ts";
import { parseUptimeKumaProviderResult } from "./parse.ts";
import { UptimeKumaProviderConfigSchema } from "./schema.ts";

export const uptimeKumaProviderAdapter = defineProviderAdapter({
  manifest: uptimeKumaProviderManifest,
  configSchema: UptimeKumaProviderConfigSchema,
  parse: parseUptimeKumaProviderResult,
});

export const uptimeKumaProviderParser = uptimeKumaProviderAdapter;
