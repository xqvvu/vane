import type { EventDetailData } from "#/features/events/ui/event-detail-types";

export function getEventDeliveryStats(deliveries: EventDetailData["deliveries"]) {
  const stats = {
    failed: 0,
    pending: 0,
    running: 0,
    succeeded: 0,
  };

  for (const delivery of deliveries) {
    stats[delivery.state] += 1;
  }

  return stats;
}
