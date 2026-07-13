import { Route } from "reicon-react";

import { Badge } from "#/components/ui/badge.tsx";
import type { SourceRouteCoverage } from "#/features/sources/model/source-route-coverage.ts";
import { useTranslations } from "#/i18n/use-i18n.ts";

export function SourceRouteCoverageCell({ coverage }: { coverage: SourceRouteCoverage }) {
  const t = useTranslations();
  const title = routeCoverageTitle(coverage, t);

  return (
    <div className="flex min-w-0 justify-center">
      <Badge
        variant={coverage.enabledRouteCount > 0 ? "secondary" : "outline"}
        className="max-w-full font-mono text-[11px]"
        title={title}
      >
        <Route data-icon="inline-start" aria-hidden />
        {coverage.enabledRouteCount > 0
          ? t("sources.table.routes.covered", {
              count: coverage.enabledRouteCount,
            })
          : t("sources.table.routes.none")}
      </Badge>
    </div>
  );
}

function routeCoverageTitle(
  coverage: SourceRouteCoverage,
  t: ReturnType<typeof useTranslations>,
): string {
  if (coverage.routeNames.length === 0) {
    return t("sources.table.routes.noneTitle");
  }

  return t("sources.table.routes.coveredTitle", {
    count: coverage.enabledRouteCount,
    direct: coverage.directRouteCount,
    catchAll: coverage.catchAllRouteCount,
    names: coverage.routeNames.join(", "),
  });
}
