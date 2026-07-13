import { queryOptions } from "@tanstack/react-query";

import {
  getDestinationTemplateDraftFn,
  listDestinationCatalogFn,
  listDestinationsFn,
} from "#/server/functions/configuration.functions.ts";

export const destinationQueryKeys = {
  all: ["destinations"] as const,
  list: () => [...destinationQueryKeys.all, "list"] as const,
  templateDraft: (id: string) => [...destinationQueryKeys.all, "detail", id, "template"] as const,
};

export function destinationsQueryOptions() {
  return queryOptions({
    queryKey: destinationQueryKeys.list(),
    queryFn: () => listDestinationsFn(),
  });
}

export function destinationTemplateDraftQueryOptions(id: string) {
  return queryOptions({
    queryKey: destinationQueryKeys.templateDraft(id),
    queryFn: () => getDestinationTemplateDraftFn({ data: { id } }),
  });
}

export const destinationCatalogQueryKeys = {
  all: ["destination-catalog"] as const,
  list: () => [...destinationCatalogQueryKeys.all, "list"] as const,
};

export function destinationCatalogQueryOptions() {
  return queryOptions({
    queryKey: destinationCatalogQueryKeys.list(),
    queryFn: () => listDestinationCatalogFn(),
    staleTime: Number.POSITIVE_INFINITY,
  });
}
