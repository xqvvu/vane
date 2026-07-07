import { queryOptions } from "@tanstack/react-query";

import {
  listConfigurationFn,
  listDestinationCatalogFn,
} from "#/server/functions/configuration.functions.ts";

export const configurationQueryKeys = {
  all: ["configuration"] as const,
  snapshot: () => [...configurationQueryKeys.all, "snapshot"] as const,
};

export function configurationQueryOptions() {
  return queryOptions({
    queryKey: configurationQueryKeys.snapshot(),
    queryFn: () => listConfigurationFn(),
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
