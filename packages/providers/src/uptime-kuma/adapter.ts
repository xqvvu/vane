import { Adapter } from "#/utils.ts";

import { uptimeKumaProviderManifest } from "#/uptime-kuma/manifest.ts";
import { parseUptimeKumaProviderResult } from "#/uptime-kuma/parse.ts";
import { UptimeKumaProviderConfigSchema } from "#/uptime-kuma/schema.ts";

export const uptimeKumaProviderAdapter = Adapter.define({
  manifest: uptimeKumaProviderManifest,
  configSchema: UptimeKumaProviderConfigSchema,
  parse: parseUptimeKumaProviderResult,
});

export const uptimeKumaProviderParser = uptimeKumaProviderAdapter;
