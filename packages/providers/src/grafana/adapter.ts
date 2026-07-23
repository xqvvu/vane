import { Adapter } from "#providers/utils";

import { grafanaProviderManifest } from "#providers/grafana/manifest";
import { parseGrafanaProviderResult } from "#providers/grafana/parse";
import { GrafanaProviderConfigSchema } from "#providers/grafana/schema";

export const grafanaProviderAdapter = Adapter.define({
  manifest: grafanaProviderManifest,
  configSchema: GrafanaProviderConfigSchema,
  parse: parseGrafanaProviderResult,
});

export const grafanaProviderParser = grafanaProviderAdapter;
