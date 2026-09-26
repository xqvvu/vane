import { orpc } from "#/lib/orpc";

export const sourceQueryKeys = {
  all: ["sources"] as const,
  list: () => [...sourceQueryKeys.all, "list"] as const,
};

export function sourcesQueryOptions() {
  return orpc.sources.list.queryOptions({
    queryKey: sourceQueryKeys.list(),
  });
}
