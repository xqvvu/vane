import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import {
  getDeliveryDetailFn,
  getEventDetailFn,
  retryDeliveryFn,
  runDeliveryWorkerFn,
} from "#/application/functions/operations.functions.ts";
import { operationsQueryKeys } from "#/features/operations/api/operations.queries.ts";

export function useOperationMutations() {
  const queryClient = useQueryClient();
  const getEventDetail = useServerFn(getEventDetailFn);
  const getDeliveryDetail = useServerFn(getDeliveryDetailFn);
  const retryDelivery = useServerFn(retryDeliveryFn);
  const runDeliveryWorker = useServerFn(runDeliveryWorkerFn);

  return {
    getEventDetail,
    getDeliveryDetail,
    retryDelivery,
    runDeliveryWorker,
    invalidateOperations: () =>
      queryClient.invalidateQueries({
        queryKey: operationsQueryKeys.all,
      }),
  };
}
