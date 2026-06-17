import type {
  DeliveryListItem,
  DeliveryState,
  EventDetail,
  EventListItem,
  NormalizedEvent,
} from "@vane/core";
import type { Page } from "@vane/core";

export type { DeliveryListItem, EventDetail, EventDetailDelivery, EventListItem } from "@vane/core";

export interface HistoryRepository {
  listEvents(query?: EventListQuery): Page<EventListItem>;
  getEventDetail(eventId: string): EventDetail | null;
  listDeliveries(query?: DeliveryListQuery): Page<DeliveryListItem>;
}

export interface EventListQuery {
  sourceId?: string;
  severity?: NormalizedEvent["severity"];
  status?: NormalizedEvent["status"];
  q?: string;
  cursor?: string;
  limit?: number;
}

export interface DeliveryListQuery {
  sourceId?: string;
  severity?: NormalizedEvent["severity"];
  status?: NormalizedEvent["status"];
  destinationId?: string;
  state?: DeliveryState;
  q?: string;
  cursor?: string;
  limit?: number;
}
