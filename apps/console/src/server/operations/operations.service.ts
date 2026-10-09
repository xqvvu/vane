import type { DeliveryDetail, DeliveryJob } from "@vane/core";

import type {
  ListOperationsInput,
  OperationsList,
  OperationsServiceOptions,
} from "#/server/operations/operations.service.types";

export class OperationsService {
  private readonly store: OperationsServiceOptions["store"];

  constructor(options: OperationsServiceOptions) {
    this.store = options.store;
  }

  async listOperations(input: ListOperationsInput = {}): Promise<OperationsList> {
    const limit = input.limit ?? 20;
    const [events, deliveries] = await Promise.all([
      this.store.history.listEvents({
        limit,
        sourceId: input.sourceId,
        severity: input.severity,
        status: input.status,
        q: input.q,
        page: input.eventPage ?? 1,
      }),
      this.store.history.listDeliveries({
        limit,
        sourceId: input.sourceId,
        severity: input.severity,
        status: input.status,
        destinationId: input.destinationId,
        state: input.deliveryState,
        q: input.q,
        cursor: input.deliveryCursor,
      }),
    ]);

    return { events, deliveries };
  }

  async getEventDetail(eventId: string) {
    return this.store.history.getEventDetail(eventId);
  }

  async getDeliveryDetail(deliveryId: string): Promise<DeliveryDetail | null> {
    return this.store.deliveries.get(deliveryId);
  }

  async retryDelivery(deliveryId: string): Promise<DeliveryJob> {
    return this.store.deliveries.retryNow({ deliveryId });
  }
}
