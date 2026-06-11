import { DeliveryDetailView } from "#/features/deliveries/ui/delivery-detail-view.tsx";
import { EventDetailView } from "#/features/events/ui/event-detail-view.tsx";
import type { DeliveryDetail, EventDetail } from "#/features/operations/model/operation-types.ts";

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
