import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import {
  createSourceFn,
  rotateSourceTokenFn,
  updateSourceFn,
} from "#/application/functions/configuration.functions.ts";
import { configurationQueryKeys } from "#/features/configuration/api/configuration.queries.ts";

export function useSourceMutations() {
  const queryClient = useQueryClient();
  const createSource = useServerFn(createSourceFn);
  const updateSource = useServerFn(updateSourceFn);
  const rotateSourceToken = useServerFn(rotateSourceTokenFn);

  return {
    createSource,
    updateSource,
    rotateSourceToken,
    invalidateSources: () =>
      queryClient.invalidateQueries({
        queryKey: configurationQueryKeys.all,
      }),
  };
}
