import { RiDashboardLine } from "@remixicon/react";
import alertmanagerIconUrl from "@vane/providers/assets/provider-icons/alertmanager.svg";
import grafanaIconUrl from "@vane/providers/assets/provider-icons/grafana.svg";
import signozIconUrl from "@vane/providers/assets/provider-icons/signoz.svg";
import uptimeKumaIconUrl from "@vane/providers/assets/provider-icons/uptime-kuma.svg";

import type { SourceSummary } from "#/features/sources/ui/source-ui-types.ts";

type SourceProviderIconValue =
  | { kind: "image"; src: string }
  | { kind: "component"; Icon: typeof RiDashboardLine };

export function SourceProviderIcon({ provider }: { provider: SourceSummary["provider"] }) {
  const providerIcon = sourceProviderIcon(provider);

  if (providerIcon.kind === "image") {
    return <img className="size-5 object-contain" src={providerIcon.src} alt="" aria-hidden />;
  }

  return <providerIcon.Icon className="text-muted-foreground size-4" aria-hidden />;
}

function sourceProviderIcon(provider: SourceSummary["provider"]): SourceProviderIconValue {
  switch (provider) {
    case "alertmanager":
      return { kind: "image", src: alertmanagerIconUrl };
    case "grafana":
      return { kind: "image", src: grafanaIconUrl };
    case "signoz":
      return { kind: "image", src: signozIconUrl };
    case "uptime_kuma":
      return { kind: "image", src: uptimeKumaIconUrl };
    case "generic":
      return { kind: "component", Icon: RiDashboardLine };
  }
}
