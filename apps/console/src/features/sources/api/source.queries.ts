import { queryOptions } from "@tanstack/react-query";

import { listSourcesFn } from "#/server/functions/configuration.functions";

export const sourceQueryKeys = {
  all: ["sources"] as const,
  list: () => [...sourceQueryKeys.all, "list"] as const,
};

export function sourcesQueryOptions() {
  return queryOptions({
    queryKey: sourceQueryKeys.list(),
    queryFn: () => listSourcesFn(),
  });
}
