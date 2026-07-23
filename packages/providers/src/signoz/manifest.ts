import type { ProviderManifest } from "#providers/types";

export const signozProviderManifest = {
  provider: "signoz",
  configVersion: 1,
  lifecycle: {
    status: "stable",
  },
  displayNameKey: "sources.providers.signoz",
  descriptionKey: "sources.form.providerDescription",
  iconName: "signoz",
  configFields: [],
  secretFields: [],
  capabilities: {
    parse: true,
    testPayload: true,
    sourceToken: true,
    additionalSharedSecret: true,
  },
} satisfies ProviderManifest<"signoz">;
