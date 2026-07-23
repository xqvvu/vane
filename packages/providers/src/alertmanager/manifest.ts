import type { ProviderManifest } from "#providers/types";

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
    additionalSharedSecret: true,
  },
} satisfies ProviderManifest<"alertmanager">;
