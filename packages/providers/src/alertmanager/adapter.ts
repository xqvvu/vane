import { alertmanagerProviderManifest } from "#providers/alertmanager/manifest";
import { parseAlertmanagerProviderResult } from "#providers/alertmanager/parse";
import { AlertmanagerProviderConfigSchema } from "#providers/alertmanager/schema";
import { Adapter } from "#providers/utils";

export const alertmanagerProviderAdapter = Adapter.define({
  manifest: alertmanagerProviderManifest,
  configSchema: AlertmanagerProviderConfigSchema,
  parse: parseAlertmanagerProviderResult,
});

export const alertmanagerProviderParser = alertmanagerProviderAdapter;
