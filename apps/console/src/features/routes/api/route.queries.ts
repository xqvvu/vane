import { orpc } from "#/lib/orpc";

export const routeQueryKeys = {
  all: ["routes"] as const,
  list: () => [...routeQueryKeys.all, "list"] as const,
};

export function routesQueryOptions() {
  return orpc.routes.list.queryOptions({
    queryKey: routeQueryKeys.list(),
  });
}
