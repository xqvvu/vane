import { createFileRoute } from "@tanstack/react-router";

import { routesQueryOptions } from "#/features/routes/api/route.queries.ts";
import { sourcesQueryOptions } from "#/features/sources/api/source.queries.ts";
import { SourcesPage } from "#/features/sources/ui/sources-page.tsx";
import { DashboardContentLayout } from "#/shell/dashboard-layout.tsx";

export const Route = createFileRoute("/_dashboard/sources")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(sourcesQueryOptions()),
      context.queryClient.ensureQueryData(routesQueryOptions()),
    ]),
  component: SourcesPage,
  pendingComponent: DashboardContentLayout.Skeleton,
  pendingMs: 120,
  pendingMinMs: 250,
});
