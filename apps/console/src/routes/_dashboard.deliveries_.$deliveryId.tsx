import { createFileRoute } from "@tanstack/react-router";

import { DeliveryDetailPage } from "#/features/deliveries/ui/delivery-detail-page";
import { deliveryDetailQueryOptions } from "#/features/operations/api/operations.queries";
import { DashboardContentLayout } from "#/shell/dashboard-layout";

export const Route = createFileRoute("/_dashboard/deliveries_/$deliveryId")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(deliveryDetailQueryOptions(params.deliveryId)),
  component: DeliveryDetailRoute,
  pendingComponent: DashboardContentLayout.DetailSkeleton,
  pendingMs: 120,
  pendingMinMs: 250,
});

function DeliveryDetailRoute() {
  const { deliveryId } = Route.useParams();

  return <DeliveryDetailPage deliveryId={deliveryId} />;
}
