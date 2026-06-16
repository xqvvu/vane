import alertmanagerIconUrl from "@vane/providers/assets/provider-icons/alertmanager.svg";
import grafanaIconUrl from "@vane/providers/assets/provider-icons/grafana.svg";
import signozIconUrl from "@vane/providers/assets/provider-icons/signoz.svg";
import uptimeKumaIconUrl from "@vane/providers/assets/provider-icons/uptime-kuma.svg";
import webhookIconUrl from "@vane/providers/assets/provider-icons/webhook.svg";

import type { SourceSummary } from "#/features/sources/ui/source-ui-types.ts";

export function SourceProviderIcon({ provider }: { provider: SourceSummary["provider"] }) {
  return (
    <img
      className="size-5 object-contain"
      src={sourceProviderIconUrl(provider)}
      alt=""
      aria-hidden
    />
  );
}

function sourceProviderIconUrl(provider: SourceSummary["provider"]): string {
  switch (provider) {
    case "alertmanager":
      return alertmanagerIconUrl;
    case "grafana":
      return grafanaIconUrl;
    case "signoz":
      return signozIconUrl;
    case "uptime_kuma":
      return uptimeKumaIconUrl;
    case "generic":
      return webhookIconUrl;
  }
}
