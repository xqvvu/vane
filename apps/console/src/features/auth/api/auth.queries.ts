import { queryOptions } from "@tanstack/react-query";

import { getDashboardSessionFn } from "#/application/functions/auth.functions.ts";

export const authQueryKeys = {
  all: ["auth"] as const,
  dashboardSession: () => [...authQueryKeys.all, "dashboard-session"] as const,
};

export function dashboardSessionQueryOptions() {
  return queryOptions({
    queryKey: authQueryKeys.dashboardSession(),
    queryFn: () => getDashboardSessionFn(),
  });
}
