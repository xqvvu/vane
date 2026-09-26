import { useQueryClient } from "@tanstack/react-query";

import { operationsQueryKeys } from "#/features/operations/api/operations.queries";
import { orpc } from "#/lib/orpc";

export function useOperationMutations() {
  const queryClient = useQueryClient();

  return {
    retryDelivery: orpc.operations.retryDelivery.call,
    replayEvent: orpc.operations.replayEvent.call,
    replayRouteEvents: orpc.operations.replayRouteEvents.call,
    runDeliveryWorker: orpc.operations.runDeliveryWorker.call,
    invalidateOperations: () =>
      queryClient.invalidateQueries({
        queryKey: operationsQueryKeys.all,
      }),
  };
}
