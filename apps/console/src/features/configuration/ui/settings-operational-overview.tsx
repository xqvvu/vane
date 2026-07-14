import { useSuspenseQueries } from "@tanstack/react-query";

import { appSettingsQueryOptions } from "#/features/configuration/api/configuration.queries.ts";
import { OperationalSummary } from "#/features/configuration/ui/operational-summary.tsx";
import { destinationsQueryOptions } from "#/features/destinations/api/destination.queries.ts";
import { routesQueryOptions } from "#/features/routes/api/route.queries.ts";
import { sourcesQueryOptions } from "#/features/sources/api/source.queries.ts";

export function SettingsOperationalOverview() {
  const [{ data: settings }, { data: sources }, { data: destinations }, { data: routes }] =
    useSuspenseQueries({
      queries: [
        appSettingsQueryOptions(),
        sourcesQueryOptions(),
        destinationsQueryOptions(),
        routesQueryOptions(),
      ],
    });

  return (
    <OperationalSummary
      sources={sources}
      destinations={destinations}
      routes={routes}
      retentionDays={settings.rawPayloadRetentionDays}
    />
  );
}
