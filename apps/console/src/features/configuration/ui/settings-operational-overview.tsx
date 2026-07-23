import { useSuspenseQueries } from "@tanstack/react-query";

import { appSettingsQueryOptions } from "#/features/configuration/api/configuration.queries";
import { OperationalSummary } from "#/features/configuration/ui/operational-summary";
import { destinationsQueryOptions } from "#/features/destinations/api/destination.queries";
import { routesQueryOptions } from "#/features/routes/api/route.queries";
import { sourcesQueryOptions } from "#/features/sources/api/source.queries";

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
