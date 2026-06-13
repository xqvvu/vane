import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import {
  retryDeliveryFn,
  runDeliveryWorkerFn,
} from "#/application/functions/operations.functions.ts";
import { operationsQueryKeys } from "#/features/operations/api/operations.queries.ts";

export function useOperationMutations() {
  const queryClient = useQueryClient();
  const retryDelivery = useServerFn(retryDeliveryFn);
  const runDeliveryWorker = useServerFn(runDeliveryWorkerFn);

  return {
    retryDelivery,
    runDeliveryWorker,
    invalidateOperations: () =>
      queryClient.invalidateQueries({
        queryKey: operationsQueryKeys.all,
      }),
  };
}
