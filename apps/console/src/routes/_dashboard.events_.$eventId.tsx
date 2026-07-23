import { createFileRoute } from "@tanstack/react-router";

import { EventDetailPage } from "#/features/events/ui/event-detail-page";
import { eventDetailQueryOptions } from "#/features/operations/api/operations.queries";
import { DashboardContentLayout } from "#/shell/dashboard-layout";

export const Route = createFileRoute("/_dashboard/events_/$eventId")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(eventDetailQueryOptions(params.eventId)),
  component: EventDetailRoute,
  pendingComponent: DashboardContentLayout.DetailSkeleton,
  pendingMs: 120,
  pendingMinMs: 250,
});

function EventDetailRoute() {
  const { eventId } = Route.useParams();

  return <EventDetailPage eventId={eventId} />;
}
