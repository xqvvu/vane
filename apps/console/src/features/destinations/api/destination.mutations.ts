import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { destinationQueryKeys } from "#/features/destinations/api/destination.queries";
import { routeQueryKeys } from "#/features/routes/api/route.queries";
import {
  createDestinationFn,
  deleteDestinationFn,
  previewDestinationDraftFn,
  previewDestinationFn,
  previewDestinationUpdateFn,
  testDestinationFn,
  updateDestinationFn,
} from "#/server/functions/configuration.functions";

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
      Promise.all([
        queryClient.invalidateQueries({ queryKey: destinationQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: routeQueryKeys.all }),
      ]),
  };
}
