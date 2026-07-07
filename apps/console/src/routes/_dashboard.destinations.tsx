import { createFileRoute } from "@tanstack/react-router";

import {
  configurationQueryOptions,
  destinationCatalogQueryOptions,
} from "#/features/configuration/api/configuration.queries.ts";
import { DestinationsPage } from "#/features/destinations/ui/destinations-page.tsx";
import { DashboardContentLayout } from "#/shell/dashboard-layout.tsx";

export const Route = createFileRoute("/_dashboard/destinations")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(configurationQueryOptions()),
      context.queryClient.ensureQueryData(destinationCatalogQueryOptions()),
    ]),
  component: DestinationsPage,
  pendingComponent: DashboardContentLayout.Skeleton,
  pendingMs: 120,
  pendingMinMs: 250,
});
