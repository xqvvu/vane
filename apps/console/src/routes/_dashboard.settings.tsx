import { createFileRoute } from "@tanstack/react-router";

import { appSettingsQueryOptions } from "#/features/configuration/api/configuration.queries.ts";
import { SettingsPage } from "#/features/configuration/ui/settings-page.tsx";
import { destinationsQueryOptions } from "#/features/destinations/api/destination.queries.ts";
import { routesQueryOptions } from "#/features/routes/api/route.queries.ts";
import { sourcesQueryOptions } from "#/features/sources/api/source.queries.ts";
import { DashboardContentLayout } from "#/shell/dashboard-layout.tsx";

export const Route = createFileRoute("/_dashboard/settings")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(appSettingsQueryOptions()),
      context.queryClient.ensureQueryData(sourcesQueryOptions()),
      context.queryClient.ensureQueryData(destinationsQueryOptions()),
      context.queryClient.ensureQueryData(routesQueryOptions()),
    ]),
  component: SettingsPage,
  pendingComponent: DashboardContentLayout.SettingsSkeleton,
  pendingMs: 120,
  pendingMinMs: 250,
});
