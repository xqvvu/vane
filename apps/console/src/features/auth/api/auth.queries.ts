import { orpc } from "#/lib/orpc";

export const authQueryKeys = {
  all: ["auth"] as const,
  dashboardSession: () => [...authQueryKeys.all, "dashboard-session"] as const,
  bootstrap: () => [...authQueryKeys.all, "bootstrap"] as const,
};

export function dashboardSessionQueryOptions() {
  return orpc.auth.getDashboardSession.queryOptions({
    queryKey: authQueryKeys.dashboardSession(),
  });
}

export function authBootstrapQueryOptions() {
  return orpc.auth.getAuthBootstrap.queryOptions({
    queryKey: authQueryKeys.bootstrap(),
  });
}
