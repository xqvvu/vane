import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { dashboardSessionQueryOptions } from "#/features/auth/api/auth.queries.ts";
import { configurationQueryOptions } from "#/features/configuration/api/configuration.queries.ts";
import { DashboardLayout } from "#/shell/dashboard-layout.tsx";
import { DashboardNotFoundPage } from "#/shell/dashboard-not-found.tsx";

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
  notFoundComponent: DashboardNotFoundPage,
});

function DashboardRouteLayout() {
  const { data: session } = useSuspenseQuery(dashboardSessionQueryOptions());

  if (!session) {
    return null;
  }

  return (
    <DashboardLayout user={session.user}>
      <Outlet />
    </DashboardLayout>
  );
}
