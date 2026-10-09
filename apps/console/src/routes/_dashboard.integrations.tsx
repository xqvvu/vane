import { createFileRoute } from "@tanstack/react-router";

import { feishuAppsQueryOptions } from "#/features/integrations/api/feishu-app.queries";
import { FeishuAppsPage } from "#/features/integrations/ui/feishu-apps-page";
import { DashboardContentLayout } from "#/shell/dashboard-layout";

export const Route = createFileRoute("/_dashboard/integrations")({
  loader: ({ context }) => context.queryClient.ensureQueryData(feishuAppsQueryOptions()),
  component: FeishuAppsPage,
  pendingComponent: DashboardContentLayout.Skeleton,
  pendingMs: 120,
  pendingMinMs: 250,
});
