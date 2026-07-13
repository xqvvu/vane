import { queryOptions } from "@tanstack/react-query";

import { listRoutesFn } from "#/server/functions/configuration.functions.ts";

export const routeQueryKeys = {
  all: ["routes"] as const,
  list: () => [...routeQueryKeys.all, "list"] as const,
};

export function routesQueryOptions() {
  return queryOptions({
    queryKey: routeQueryKeys.list(),
    queryFn: () => listRoutesFn(),
  });
}
