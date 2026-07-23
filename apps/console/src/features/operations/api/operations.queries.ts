import { queryOptions } from "@tanstack/react-query";

import type { OperationFilterData } from "#/features/operations/model/operation-search";
import {
  getDeliveryDetailFn,
  getEventDetailFn,
  listOperationsFn,
  previewEventReplayFn,
  previewRouteReplayFn,
} from "#/server/functions/operations.functions";

export const operationsQueryKeys = {
  all: ["operations"] as const,
  list: (filters: OperationFilterData) =>
    [...operationsQueryKeys.all, "list", normalizeOperationFilters(filters)] as const,
  eventDetail: (eventId: string) => [...operationsQueryKeys.all, "events", "detail", eventId],
  eventReplayPreview: (eventId: string) => [
    ...operationsQueryKeys.all,
    "events",
    "replay-preview",
    eventId,
  ],
  routeReplayPreview: (routeId: string) => [
    ...operationsQueryKeys.all,
    "routes",
    "replay-preview",
    routeId,
  ],
  deliveryDetail: (deliveryId: string) => [
    ...operationsQueryKeys.all,
    "deliveries",
    "detail",
    deliveryId,
  ],
};

export function operationsQueryOptions(filters: OperationFilterData) {
  const normalizedFilters = normalizeOperationFilters(filters);

  return queryOptions({
    queryKey: operationsQueryKeys.list(normalizedFilters),
    queryFn: () =>
      listOperationsFn({
        data: {
          limit: 20,
          eventPage: normalizedFilters.eventPage ?? 1,
          ...normalizedFilters,
        },
      }),
  });
}

export function eventDetailQueryOptions(eventId: string) {
  return queryOptions({
    queryKey: operationsQueryKeys.eventDetail(eventId),
    queryFn: () =>
      getEventDetailFn({
        data: {
          id: eventId,
        },
      }),
  });
}

export function eventReplayPreviewQueryOptions(eventId: string) {
  return queryOptions({
    queryKey: operationsQueryKeys.eventReplayPreview(eventId),
    queryFn: () =>
      previewEventReplayFn({
        data: {
          eventId,
        },
      }),
  });
}

export function routeReplayPreviewQueryOptions(routeId: string) {
  return queryOptions({
    queryKey: operationsQueryKeys.routeReplayPreview(routeId),
    queryFn: () =>
      previewRouteReplayFn({
        data: {
          routeId,
          limit: 20,
        },
      }),
  });
}

export function deliveryDetailQueryOptions(deliveryId: string) {
  return queryOptions({
    queryKey: operationsQueryKeys.deliveryDetail(deliveryId),
    queryFn: () =>
      getDeliveryDetailFn({
        data: {
          id: deliveryId,
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
    ...(filters.eventPage && filters.eventPage > 1 ? { eventPage: filters.eventPage } : {}),
    ...(filters.deliveryCursor ? { deliveryCursor: filters.deliveryCursor } : {}),
  };
}
