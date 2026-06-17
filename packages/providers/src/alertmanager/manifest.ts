import type { ProviderManifest } from "#/types.ts";

export const alertmanagerProviderManifest = {
  provider: "alertmanager",
  configVersion: 1,
  lifecycle: {
    status: "stable",
  },
  displayNameKey: "sources.providers.alertmanager",
  descriptionKey: "sources.form.providerDescription",
  iconName: "alertmanager",
  configFields: [],
  secretFields: [],
  capabilities: {
    parse: true,
    testPayload: true,
    sourceToken: true,
    providerSecret: true,
  },
} satisfies ProviderManifest<"alertmanager">;
