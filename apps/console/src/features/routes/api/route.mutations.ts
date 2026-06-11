import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { createRouteFn, updateRouteFn } from "#/application/functions/configuration.functions.ts";
import { configurationQueryKeys } from "#/features/configuration/api/configuration.queries.ts";

export function useRouteMutations() {
  const queryClient = useQueryClient();
  const createRoute = useServerFn(createRouteFn);
  const updateRoute = useServerFn(updateRouteFn);

  return {
    createRoute,
    updateRoute,
    invalidateRoutes: () =>
      queryClient.invalidateQueries({
        queryKey: configurationQueryKeys.all,
      }),
  };
}
