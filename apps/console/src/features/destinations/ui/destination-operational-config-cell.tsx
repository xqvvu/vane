import type { DestinationListItem } from "#/features/destinations/ui/destination-ui-types";
import { useTranslations } from "#/i18n/use-i18n";

export function DestinationOperationalConfigCell({
  destination,
}: {
  destination: DestinationListItem;
}) {
  const t = useTranslations();
  const { operationalConfig } = destination;
  const primary = operationalConfigPrimaryLine(destination, t);
  const secondary = operationalConfigSecondaryLine(operationalConfig, t);

  return (
    <div className="min-w-0">
      <div className="truncate font-mono text-xs" title={primary}>
        {primary}
      </div>
      <div className="text-muted-foreground mt-0.5 truncate text-[11px]" title={secondary}>
        {secondary}
      </div>
    </div>
  );
}

function operationalConfigPrimaryLine(
  destination: DestinationListItem,
  t: ReturnType<typeof useTranslations>,
): string {
  const { operationalConfig } = destination;

  if (operationalConfig.endpoint) {
    return operationalConfig.endpoint;
  }

  if (operationalConfig.from) {
    return operationalConfig.from;
  }

  if (operationalConfig.to && operationalConfig.to.length > 0) {
    return operationalConfig.to.join(", ");
  }

  return t("destinations.table.operationalConfig.empty");
}

function operationalConfigSecondaryLine(
  operationalConfig: DestinationListItem["operationalConfig"],
  t: ReturnType<typeof useTranslations>,
): string {
  const parts: string[] = [];

  if (operationalConfig.method) {
    parts.push(operationalConfig.method);
  }

  if (operationalConfig.to && operationalConfig.to.length > 0 && operationalConfig.endpoint) {
    parts.push(operationalConfig.to.join(", "));
  }

  if (operationalConfig.templateSource === "builtin") {
    parts.push(t("destinations.table.operationalConfig.templateBuiltin"));
  } else if (operationalConfig.templateMode) {
    parts.push(
      t("destinations.table.operationalConfig.templateMode", {
        mode: operationalConfig.templateMode,
      }),
    );
  } else if (operationalConfig.templateConfigured) {
    parts.push(t("destinations.table.operationalConfig.templateOn"));
  }

  if (operationalConfig.signingConfigured) {
    parts.push(t("destinations.table.operationalConfig.signingOn"));
  }

  if (operationalConfig.headerNames && operationalConfig.headerNames.length > 0) {
    parts.push(
      t("destinations.table.operationalConfig.headerCount", {
        count: operationalConfig.headerNames.length,
      }),
    );
  }

  if (parts.length === 0) {
    return t("destinations.table.operationalConfig.detailsEmpty");
  }

  return parts.join(" · ");
}
