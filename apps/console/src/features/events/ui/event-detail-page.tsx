import { RiArrowLeftLine, RiErrorWarningLine } from "@remixicon/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import { Alert, AlertDescription, AlertTitle } from "#/components/ui/alert.tsx";
import { Badge } from "#/components/ui/badge.tsx";
import { buttonVariants } from "#/components/ui/button.tsx";
import { EventDetailView } from "#/features/events/ui/event-detail-view.tsx";
import { eventDetailQueryOptions } from "#/features/operations/api/operations.queries.ts";
import { cn } from "#/lib/utils.ts";
import { DashboardContentLayout } from "#/shell/dashboard-layout.tsx";

export function EventDetailPage({ eventId }: { eventId: string }) {
  const { data: detail } = useSuspenseQuery(eventDetailQueryOptions(eventId));

  return (
    <DashboardContentLayout
      main={
        <>
          <EventDetailPageToolbar eventId={eventId} />
          <div className="p-3">
            {detail ? (
              <section className="border-border bg-background border p-3">
                <EventDetailView detail={detail} />
              </section>
            ) : (
              <Alert variant="destructive">
                <RiErrorWarningLine aria-hidden />
                <AlertTitle>Event not found</AlertTitle>
                <AlertDescription>
                  The event may have been deleted or the URL points to a different Vane database.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </>
      }
    />
  );
}

function EventDetailPageToolbar({ eventId }: { eventId: string }) {
  return (
    <header className="border-border bg-background flex flex-col gap-3 border-b px-3 py-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <h1 className="font-heading text-2xl leading-none font-semibold">Event detail</h1>
          <Badge variant="outline" className="max-w-48 truncate font-mono text-[10px]">
            {eventId}
          </Badge>
        </div>
        <p className="text-muted-foreground mt-2 text-sm">
          Inspect normalized fields, intake-time route matches, deliveries, and redacted raw data.
        </p>
      </div>
      <Link
        to="/events"
        className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-fit")}
      >
        <RiArrowLeftLine data-icon="inline-start" aria-hidden />
        Events
      </Link>
    </header>
  );
}
