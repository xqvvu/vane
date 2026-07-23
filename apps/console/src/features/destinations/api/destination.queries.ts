import { queryOptions } from "@tanstack/react-query";

import type { DestinationEditorDraftResult, DestinationListItem } from "@vane/core";
import type { DestinationCatalogItem } from "@vane/destinations";

import {
  getDestinationTemplateDraftFn,
  listDestinationCatalogFn,
  listDestinationsFn,
} from "#/server/functions/configuration.functions";

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
  return queryOptions({
    queryKey: destinationQueryKeys.list(),
    queryFn: async (): Promise<DestinationListItem[]> => listDestinationsFn(),
  });
}

export function destinationTemplateDraftQueryOptions(id: string) {
  return queryOptions({
    queryKey: destinationQueryKeys.templateDraft(id),
    queryFn: async (): Promise<DestinationEditorDraftResult> =>
      getDestinationTemplateDraftFn({ data: { id } }),
  });
}

export const destinationCatalogQueryKeys = {
  all: ["destination-catalog"] as const,
  list: () => [...destinationCatalogQueryKeys.all, "list"] as const,
};

export function destinationCatalogQueryOptions() {
  return queryOptions({
    queryKey: destinationCatalogQueryKeys.list(),
    queryFn: async (): Promise<DestinationCatalogItem[]> => listDestinationCatalogFn(),
    staleTime: Number.POSITIVE_INFINITY,
  });
}
