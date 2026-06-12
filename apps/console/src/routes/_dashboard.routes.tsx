import { createFileRoute } from "@tanstack/react-router";

import { configurationQueryOptions } from "#/features/configuration/api/configuration.queries.ts";
import { RoutesPage } from "#/features/routes/ui/routes-page.tsx";
import { DashboardContentLayout } from "#/shell/dashboard-layout.tsx";

export const Route = createFileRoute("/_dashboard/routes")({
  loader: ({ context }) => context.queryClient.ensureQueryData(configurationQueryOptions()),
  component: RoutesPage,
  pendingComponent: DashboardContentLayout.Skeleton,
  pendingMs: 120,
  pendingMinMs: 250,
});
