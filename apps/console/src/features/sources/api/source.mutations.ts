import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { configurationQueryKeys } from "#/features/configuration/api/configuration.queries.ts";
import {
  createSourceFn,
  deleteSourceFn,
  rotateSourceTokenFn,
  updateSourceFn,
} from "#/server/functions/configuration.functions.ts";

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
      queryClient.invalidateQueries({
        queryKey: configurationQueryKeys.all,
      }),
  };
}
