import { createFileRoute } from "@tanstack/react-router";

import { configurationQueryOptions } from "#/features/configuration/api/configuration.queries.ts";
import { SettingsPage } from "#/features/configuration/ui/settings-page.tsx";
import { DashboardContentLayout } from "#/shell/dashboard-layout.tsx";

export const Route = createFileRoute("/_dashboard/settings")({
  loader: ({ context }) => context.queryClient.ensureQueryData(configurationQueryOptions()),
  component: SettingsPage,
  pendingComponent: DashboardContentLayout.Skeleton,
  pendingMs: 120,
  pendingMinMs: 250,
});
