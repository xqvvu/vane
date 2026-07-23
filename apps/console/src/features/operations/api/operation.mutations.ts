import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { operationsQueryKeys } from "#/features/operations/api/operations.queries";
import {
  replayEventFn,
  replayRouteEventsFn,
  retryDeliveryFn,
  runDeliveryWorkerFn,
} from "#/server/functions/operations.functions";

export function useOperationMutations() {
  const queryClient = useQueryClient();
  const retryDelivery = useServerFn(retryDeliveryFn);
  const replayEvent = useServerFn(replayEventFn);
  const replayRouteEvents = useServerFn(replayRouteEventsFn);
  const runDeliveryWorker = useServerFn(runDeliveryWorkerFn);

  return {
    retryDelivery,
    replayEvent,
    replayRouteEvents,
    runDeliveryWorker,
    invalidateOperations: () =>
      queryClient.invalidateQueries({
        queryKey: operationsQueryKeys.all,
      }),
  };
}
