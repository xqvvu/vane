import type { ProviderManifest } from "#/types.ts";

export const grafanaProviderManifest = {
  provider: "grafana",
  configVersion: 1,
  lifecycle: {
    status: "stable",
  },
  displayNameKey: "sources.providers.grafana",
  descriptionKey: "sources.form.providerDescription",
  iconName: "grafana",
  configFields: [],
  secretFields: [],
  capabilities: {
    parse: true,
    testPayload: true,
    sourceToken: true,
    additionalSharedSecret: true,
  },
} satisfies ProviderManifest<"grafana">;
