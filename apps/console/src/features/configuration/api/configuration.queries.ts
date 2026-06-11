import { queryOptions } from "@tanstack/react-query";

import { listConfigurationFn } from "#/application/functions/configuration.functions.ts";

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
