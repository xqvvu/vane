import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { operationsQueryKeys } from "#/features/operations/api/operations.queries.ts";
import {
  replayEventFn,
  retryDeliveryFn,
  runDeliveryWorkerFn,
} from "#/server/functions/operations.functions.ts";

export function useOperationMutations() {
  const queryClient = useQueryClient();
  const retryDelivery = useServerFn(retryDeliveryFn);
  const replayEvent = useServerFn(replayEventFn);
  const runDeliveryWorker = useServerFn(runDeliveryWorkerFn);

  return {
    retryDelivery,
    replayEvent,
    runDeliveryWorker,
    invalidateOperations: () =>
      queryClient.invalidateQueries({
        queryKey: operationsQueryKeys.all,
      }),
  };
}
