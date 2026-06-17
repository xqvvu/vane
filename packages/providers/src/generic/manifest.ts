import type { ProviderManifest } from "#/types.ts";

export const genericProviderManifest = {
  provider: "generic",
  configVersion: 1,
  lifecycle: {
    status: "stable",
  },
  displayNameKey: "sources.providers.genericWebhook",
  descriptionKey: "sources.form.providerDescription",
  iconName: "webhook",
  configFields: [],
  secretFields: [],
  capabilities: {
    parse: true,
    testPayload: true,
    sourceToken: true,
    additionalSharedSecret: true,
  },
} satisfies ProviderManifest<"generic">;
