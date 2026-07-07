import { Adapter } from "#/utils.ts";

import { grafanaProviderManifest } from "#/grafana/manifest.ts";
import { parseGrafanaProviderResult } from "#/grafana/parse.ts";
import { GrafanaProviderConfigSchema } from "#/grafana/schema.ts";

export const grafanaProviderAdapter = Adapter.define({
  manifest: grafanaProviderManifest,
  configSchema: GrafanaProviderConfigSchema,
  parse: parseGrafanaProviderResult,
});

export const grafanaProviderParser = grafanaProviderAdapter;
