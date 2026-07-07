import { Adapter } from "#/utils.ts";

import { alertmanagerProviderManifest } from "#/alertmanager/manifest.ts";
import { parseAlertmanagerProviderResult } from "#/alertmanager/parse.ts";
import { AlertmanagerProviderConfigSchema } from "#/alertmanager/schema.ts";

export const alertmanagerProviderAdapter = Adapter.define({
  manifest: alertmanagerProviderManifest,
  configSchema: AlertmanagerProviderConfigSchema,
  parse: parseAlertmanagerProviderResult,
});

export const alertmanagerProviderParser = alertmanagerProviderAdapter;
