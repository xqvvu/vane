import { orpc } from "#/lib/orpc";

/**
 * Destinations client data surface.
 * Route loaders and UI should prefer these queryOptions over calling server
 * functions directly, so cache keys and DTO types stay centralized.
 */
export const destinationQueryKeys = {
  all: ["destinations"] as const,
  list: () => [...destinationQueryKeys.all, "list"] as const,
  templateDraft: (id: string) => [...destinationQueryKeys.all, "detail", id, "template"] as const,
};

export function destinationsQueryOptions() {
  return orpc.destinations.list.queryOptions({
    queryKey: destinationQueryKeys.list(),
  });
}

export function destinationTemplateDraftQueryOptions(id: string) {
  return orpc.destinations.getTemplateDraft.queryOptions({
    input: { id },
    queryKey: destinationQueryKeys.templateDraft(id),
  });
}

export const destinationCatalogQueryKeys = {
  all: ["destination-catalog"] as const,
  list: () => [...destinationCatalogQueryKeys.all, "list"] as const,
};

export function destinationCatalogQueryOptions() {
  return orpc.destinations.listCatalog.queryOptions({
    queryKey: destinationCatalogQueryKeys.list(),
    staleTime: Number.POSITIVE_INFINITY,
  });
}
