import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { routeQueryKeys } from "#/features/routes/api/route.queries";
import { sourceQueryKeys } from "#/features/sources/api/source.queries";
import {
  createSourceFn,
  deleteSourceFn,
  rotateSourceTokenFn,
  updateSourceFn,
} from "#/server/functions/configuration.functions";

export function useSourceMutations() {
  const queryClient = useQueryClient();
  const createSource = useServerFn(createSourceFn);
  const deleteSource = useServerFn(deleteSourceFn);
  const updateSource = useServerFn(updateSourceFn);
  const rotateSourceToken = useServerFn(rotateSourceTokenFn);

  return {
    createSource,
    deleteSource,
    updateSource,
    rotateSourceToken,
    invalidateSources: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: sourceQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: routeQueryKeys.all }),
      ]),
  };
}
