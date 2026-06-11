import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import {
  createDestinationFn,
  previewDestinationDraftFn,
  previewDestinationFn,
  previewDestinationUpdateFn,
  testDestinationFn,
  updateDestinationFn,
} from "#/application/functions/configuration.functions.ts";
import { configurationQueryKeys } from "#/features/configuration/api/configuration.queries.ts";

export function useDestinationMutations() {
  const queryClient = useQueryClient();
  const createDestination = useServerFn(createDestinationFn);
  const previewDestination = useServerFn(previewDestinationFn);
  const previewDestinationDraft = useServerFn(previewDestinationDraftFn);
  const previewDestinationUpdate = useServerFn(previewDestinationUpdateFn);
  const testDestination = useServerFn(testDestinationFn);
  const updateDestination = useServerFn(updateDestinationFn);

  return {
    createDestination,
    previewDestination,
    previewDestinationDraft,
    previewDestinationUpdate,
    testDestination,
    updateDestination,
    invalidateDestinations: () =>
      queryClient.invalidateQueries({
        queryKey: configurationQueryKeys.all,
      }),
  };
}
