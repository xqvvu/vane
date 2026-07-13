import { createFileRoute } from "@tanstack/react-router";

import { destinationsQueryOptions } from "#/features/destinations/api/destination.queries.ts";
import { routesQueryOptions } from "#/features/routes/api/route.queries.ts";
import { RoutesPage } from "#/features/routes/ui/routes-page.tsx";
import { sourcesQueryOptions } from "#/features/sources/api/source.queries.ts";
import { DashboardContentLayout } from "#/shell/dashboard-layout.tsx";

export const Route = createFileRoute("/_dashboard/routes")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(routesQueryOptions()),
      context.queryClient.ensureQueryData(sourcesQueryOptions()),
      context.queryClient.ensureQueryData(destinationsQueryOptions()),
    ]),
  component: RoutesPage,
  pendingComponent: DashboardContentLayout.Skeleton,
  pendingMs: 120,
  pendingMinMs: 250,
});
