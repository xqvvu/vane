import { defineProviderAdapter } from "#/types.ts";

import { alertmanagerProviderManifest } from "./manifest.ts";
import { parseAlertmanagerProviderResult } from "./parse.ts";
import { AlertmanagerProviderConfigSchema } from "./schema.ts";

export const alertmanagerProviderAdapter = defineProviderAdapter({
  manifest: alertmanagerProviderManifest,
  configSchema: AlertmanagerProviderConfigSchema,
  parse: parseAlertmanagerProviderResult,
});

export const alertmanagerProviderParser = alertmanagerProviderAdapter;
