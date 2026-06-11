import { queryOptions } from "@tanstack/react-query";

import { listOperationsFn } from "#/application/functions/operations.functions.ts";
import type { OperationFilterData } from "#/features/operations/model/operation-search.ts";

export const operationsQueryKeys = {
  all: ["operations"] as const,
  list: (filters: OperationFilterData) =>
    [...operationsQueryKeys.all, "list", normalizeOperationFilters(filters)] as const,
};

export function operationsQueryOptions(filters: OperationFilterData) {
  const normalizedFilters = normalizeOperationFilters(filters);

  return queryOptions({
    queryKey: operationsQueryKeys.list(normalizedFilters),
    queryFn: () =>
      listOperationsFn({
        data: {
          limit: 20,
          ...normalizedFilters,
        },
      }),
  });
}

function normalizeOperationFilters(filters: OperationFilterData): OperationFilterData {
  return {
    ...(filters.sourceId ? { sourceId: filters.sourceId } : {}),
    ...(filters.severity ? { severity: filters.severity } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.destinationId ? { destinationId: filters.destinationId } : {}),
    ...(filters.deliveryState ? { deliveryState: filters.deliveryState } : {}),
    ...(filters.q?.trim() ? { q: filters.q.trim() } : {}),
    ...(filters.eventCursor ? { eventCursor: filters.eventCursor } : {}),
    ...(filters.deliveryCursor ? { deliveryCursor: filters.deliveryCursor } : {}),
  };
}
