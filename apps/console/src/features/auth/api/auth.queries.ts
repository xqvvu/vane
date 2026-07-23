import { queryOptions } from "@tanstack/react-query";

import { getAuthBootstrapFn, getDashboardSessionFn } from "#/server/functions/auth.functions";

export const authQueryKeys = {
  all: ["auth"] as const,
  dashboardSession: () => [...authQueryKeys.all, "dashboard-session"] as const,
  bootstrap: () => [...authQueryKeys.all, "bootstrap"] as const,
};

export function dashboardSessionQueryOptions() {
  return queryOptions({
    queryKey: authQueryKeys.dashboardSession(),
    queryFn: () => getDashboardSessionFn(),
  });
}

export function authBootstrapQueryOptions() {
  return queryOptions({
    queryKey: authQueryKeys.bootstrap(),
    queryFn: () => getAuthBootstrapFn(),
  });
}
