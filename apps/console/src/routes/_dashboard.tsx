import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { DashboardLayout } from "#/app/shell/dashboard-layout.tsx";
import { dashboardSessionQueryOptions } from "#/features/auth/api/auth.queries.ts";
import {
  configurationQueryKeys,
  configurationQueryOptions,
} from "#/features/configuration/api/configuration.queries.ts";

export const Route = createFileRoute("/_dashboard")({
  loader: async ({ context, location }) => {
    const session = await context.queryClient.ensureQueryData(dashboardSessionQueryOptions());

    if (!session) {
      throw redirect({
        to: "/login" as const,
        search: {
          redirect: location.href,
        } as never,
      });
    }

    await context.queryClient.ensureQueryData(configurationQueryOptions());
  },
  component: DashboardRouteLayout,
});

function DashboardRouteLayout() {
  const queryClient = useQueryClient();
  const { data: session } = useSuspenseQuery(dashboardSessionQueryOptions());

  if (!session) {
    return null;
  }

  return (
    <DashboardLayout
      user={session.user}
      onRefresh={() => {
        void queryClient.invalidateQueries({ queryKey: configurationQueryKeys.all });
      }}
    >
      <Outlet />
    </DashboardLayout>
  );
}
