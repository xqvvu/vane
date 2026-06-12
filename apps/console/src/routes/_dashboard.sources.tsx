import { createFileRoute } from "@tanstack/react-router";

import { configurationQueryOptions } from "#/features/configuration/api/configuration.queries.ts";
import { SourcesPage } from "#/features/sources/ui/sources-page.tsx";
import { DashboardContentLayout } from "#/shell/dashboard-layout.tsx";

export const Route = createFileRoute("/_dashboard/sources")({
  loader: ({ context }) => context.queryClient.ensureQueryData(configurationQueryOptions()),
  component: SourcesPage,
  pendingComponent: DashboardContentLayout.Skeleton,
  pendingMs: 120,
  pendingMinMs: 250,
});
