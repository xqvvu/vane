import type { ProviderManifest } from "#/types.ts";

export const uptimeKumaProviderManifest = {
  provider: "uptime_kuma",
  configVersion: 1,
  lifecycle: {
    status: "stable",
  },
  displayNameKey: "sources.providers.uptime_kuma",
  descriptionKey: "sources.form.providerDescription",
  iconName: "uptime-kuma",
  configFields: [],
  secretFields: [],
  capabilities: {
    parse: true,
    testPayload: true,
    sourceToken: true,
    additionalSharedSecret: true,
  },
} satisfies ProviderManifest<"uptime_kuma">;
