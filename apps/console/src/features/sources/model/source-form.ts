import type { JsonObject, SourceProvider } from "@vane/core";

export function formSourceProvider(data: FormData): SourceProvider {
  return formSourceProviderValue(data.get("provider"));
}

export function formSourceProviderValue(value: FormDataEntryValue | string | null): SourceProvider {
  switch (value) {
    case "signoz":
    case "grafana":
    case "uptime_kuma":
    case "alertmanager": {
      return value;
    }
    default: {
      return "generic";
    }
  }
}

export function sourceConfigFromForm(data: FormData): JsonObject {
  const signingSecret = formString(data, "signingSecret").trim();

  return signingSecret ? { signingSecret } : {};
}

export function sourceConfigPatchFromForm(data: FormData): JsonObject | undefined {
  const config = sourceConfigFromForm(data);

  return Object.keys(config).length > 0 ? config : undefined;
}

function formString(data: FormData, key: string): string {
  const value = data.get(key);
  return typeof value === "string" ? value : "";
}
