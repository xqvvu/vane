import { DeliveryDetailView } from "#/features/deliveries/ui/delivery-detail-view";
import { EventDetailView } from "#/features/events/ui/event-detail-view";
import type { DeliveryDetail, EventDetail } from "#/features/operations/model/operation-types";

export function DetailPanel({
  eventDetail,
  deliveryDetail,
}: {
  eventDetail: EventDetail | null;
  deliveryDetail: DeliveryDetail | null;
}) {
  if (!eventDetail && !deliveryDetail) {
    return null;
  }

  return (
    <section className="border-border bg-background mt-3 border p-3">
      {eventDetail ? <EventDetailView detail={eventDetail} /> : null}
      {deliveryDetail ? <DeliveryDetailView detail={deliveryDetail} /> : null}
    </section>
  );
}
