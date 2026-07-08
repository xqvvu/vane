import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { configurationQueryKeys } from "#/features/configuration/api/configuration.queries.ts";
import {
  createDestinationFn,
  deleteDestinationFn,
  previewDestinationDraftFn,
  previewDestinationFn,
  previewDestinationUpdateFn,
  testDestinationFn,
  updateDestinationFn,
} from "#/server/functions/configuration.functions.ts";

export function useDestinationMutations() {
  const queryClient = useQueryClient();
  const createDestination = useServerFn(createDestinationFn);
  const deleteDestination = useServerFn(deleteDestinationFn);
  const previewDestination = useServerFn(previewDestinationFn);
  const previewDestinationDraft = useServerFn(previewDestinationDraftFn);
  const previewDestinationUpdate = useServerFn(previewDestinationUpdateFn);
  const testDestination = useServerFn(testDestinationFn);
  const updateDestination = useServerFn(updateDestinationFn);

  return {
    createDestination,
    deleteDestination,
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
