import { RiRouteLine } from "@remixicon/react";

import { Badge } from "#/components/ui/badge.tsx";
import type { DestinationRouteCoverage } from "#/features/destinations/model/destination-route-coverage.ts";
import { useTranslations } from "#/i18n/use-i18n.ts";

export function DestinationRouteCoverageCell({ coverage }: { coverage: DestinationRouteCoverage }) {
  const t = useTranslations();
  const title = routeCoverageTitle(coverage, t);

  return (
    <div className="flex min-w-0 justify-center">
      <Badge
        variant={coverage.enabledRouteCount > 0 ? "secondary" : "outline"}
        className="max-w-full font-mono text-[11px]"
        title={title}
      >
        <RiRouteLine data-icon="inline-start" aria-hidden />
        {coverage.enabledRouteCount > 0
          ? t("destinations.table.routes.covered", {
              count: coverage.enabledRouteCount,
            })
          : t("destinations.table.routes.none")}
      </Badge>
    </div>
  );
}

function routeCoverageTitle(
  coverage: DestinationRouteCoverage,
  t: ReturnType<typeof useTranslations>,
): string {
  if (coverage.routeNames.length === 0) {
    return coverage.disabledRouteCount > 0
      ? t("destinations.table.routes.disabledOnlyTitle", {
          count: coverage.disabledRouteCount,
        })
      : t("destinations.table.routes.noneTitle");
  }

  return t("destinations.table.routes.coveredTitle", {
    count: coverage.enabledRouteCount,
    disabled: coverage.disabledRouteCount,
    names: coverage.routeNames.join(", "),
  });
}
