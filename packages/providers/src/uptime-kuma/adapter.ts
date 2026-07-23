import { Adapter } from "#providers/utils";

import { uptimeKumaProviderManifest } from "#providers/uptime-kuma/manifest";
import { parseUptimeKumaProviderResult } from "#providers/uptime-kuma/parse";
import { UptimeKumaProviderConfigSchema } from "#providers/uptime-kuma/schema";

export const uptimeKumaProviderAdapter = Adapter.define({
  manifest: uptimeKumaProviderManifest,
  configSchema: UptimeKumaProviderConfigSchema,
  parse: parseUptimeKumaProviderResult,
});

export const uptimeKumaProviderParser = uptimeKumaProviderAdapter;
