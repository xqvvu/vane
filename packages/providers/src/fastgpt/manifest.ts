import type { ProviderManifest } from "#providers/types";

export const fastgptProviderManifest = {
  provider: "fastgpt",
  configVersion: 1,
  lifecycle: {
    status: "stable",
  },
  displayNameKey: "sources.providers.fastgpt",
  descriptionKey: "sources.form.providerDescription",
  iconName: "fastgpt",
  configFields: [],
  secretFields: [],
  capabilities: {
    parse: true,
    testPayload: true,
    sourceToken: true,
    additionalSharedSecret: true,
  },
} satisfies ProviderManifest<"fastgpt">;
