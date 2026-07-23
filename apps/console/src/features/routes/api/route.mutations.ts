import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { routeQueryKeys } from "#/features/routes/api/route.queries";
import {
  createRouteFn,
  deleteRouteFn,
  updateRouteFn,
} from "#/server/functions/configuration.functions";

export function useRouteMutations() {
  const queryClient = useQueryClient();
  const createRoute = useServerFn(createRouteFn);
  const deleteRoute = useServerFn(deleteRouteFn);
  const updateRoute = useServerFn(updateRouteFn);

  return {
    createRoute,
    deleteRoute,
    updateRoute,
    invalidateRoutes: () =>
      queryClient.invalidateQueries({
        queryKey: routeQueryKeys.all,
      }),
  };
}
