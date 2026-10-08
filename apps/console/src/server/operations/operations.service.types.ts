import type {
  DeliveryListItem,
  DeliveryState,
  EventListItem,
  NormalizedEvent,
  NumberedPage,
  Page,
} from "@vane/core";

import type { SqliteStore } from "#/infra/sqlite/store";

export interface OperationsServiceOptions {
  store: SqliteStore;
}

export interface ListOperationsInput {
  limit?: number;
  sourceId?: string;
  severity?: NormalizedEvent["severity"];
  status?: NormalizedEvent["status"];
  destinationId?: string;
  deliveryState?: DeliveryState;
  q?: string;
  eventPage?: number;
  deliveryCursor?: string;
}

export interface OperationsList {
  events: NumberedPage<EventListItem>;
  deliveries: Page<DeliveryListItem>;
}
