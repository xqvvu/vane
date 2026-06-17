import { defineProviderAdapter } from "#/types.ts";

import { grafanaProviderManifest } from "./manifest.ts";
import { parseGrafanaProviderResult } from "./parse.ts";
import { GrafanaProviderConfigSchema } from "./schema.ts";

export const grafanaProviderAdapter = defineProviderAdapter({
  manifest: grafanaProviderManifest,
  configSchema: GrafanaProviderConfigSchema,
  parse: parseGrafanaProviderResult,
});

export const grafanaProviderParser = grafanaProviderAdapter;
