import { Adapter } from "#providers/utils";

import { alertmanagerProviderManifest } from "#providers/alertmanager/manifest";
import { parseAlertmanagerProviderResult } from "#providers/alertmanager/parse";
import { AlertmanagerProviderConfigSchema } from "#providers/alertmanager/schema";

export const alertmanagerProviderAdapter = Adapter.define({
  manifest: alertmanagerProviderManifest,
  configSchema: AlertmanagerProviderConfigSchema,
  parse: parseAlertmanagerProviderResult,
});

export const alertmanagerProviderParser = alertmanagerProviderAdapter;
