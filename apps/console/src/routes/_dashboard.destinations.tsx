import { createFileRoute } from "@tanstack/react-router";

import {
  destinationCatalogQueryOptions,
  destinationsQueryOptions,
} from "#/features/destinations/api/destination.queries.ts";
import { DestinationsPage } from "#/features/destinations/ui/destinations-page.tsx";
import { routesQueryOptions } from "#/features/routes/api/route.queries.ts";
import { DashboardContentLayout } from "#/shell/dashboard-layout.tsx";

export const Route = createFileRoute("/_dashboard/destinations")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(destinationsQueryOptions()),
      context.queryClient.ensureQueryData(routesQueryOptions()),
      context.queryClient.ensureQueryData(destinationCatalogQueryOptions()),
    ]),
  component: DestinationsPage,
  pendingComponent: DashboardContentLayout.Skeleton,
  pendingMs: 120,
  pendingMinMs: 250,
});
