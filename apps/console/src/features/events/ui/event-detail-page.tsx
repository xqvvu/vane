import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, AlertTriangle } from "reicon-react";

import { PageToolbar } from "#/components/common/page-toolbar.tsx";
import { Alert, AlertDescription, AlertTitle } from "#/components/ui/alert.tsx";
import { buttonVariants } from "#/components/ui/button.tsx";
import { EventDetailView } from "#/features/events/ui/event-detail-view.tsx";
import { EventReplayAction } from "#/features/events/ui/event-replay-action.tsx";
import { eventDetailQueryOptions } from "#/features/operations/api/operations.queries.ts";
import { useTranslations } from "#/i18n/use-i18n.ts";
import { cn } from "#/lib/utils.ts";
import { DashboardContentLayout } from "#/shell/dashboard-layout.tsx";

export function EventDetailPage({ eventId }: { eventId: string }) {
  const t = useTranslations();
  const { data: detail } = useSuspenseQuery(eventDetailQueryOptions(eventId));

  return (
    <DashboardContentLayout
      main={
        <>
          <EventDetailPageToolbar eventId={eventId} canReplay={detail !== null} />
          {detail ? (
            <section className="min-h-0 flex-1 overflow-hidden">
              <EventDetailView detail={detail} />
            </section>
          ) : (
            <Alert variant="destructive">
              <AlertTriangle aria-hidden />
              <AlertTitle>{t("events.detail.notFoundTitle")}</AlertTitle>
              <AlertDescription>{t("events.detail.notFoundDescription")}</AlertDescription>
            </Alert>
          )}
        </>
      }
    />
  );
}

function EventDetailPageToolbar({ eventId, canReplay }: { eventId: string; canReplay: boolean }) {
  const t = useTranslations();

  return (
    <PageToolbar
      title={t("events.detail.title")}
      description={t("events.detail.description")}
      badge={eventId}
      actions={
        <>
          <EventReplayAction eventId={eventId} disabled={!canReplay} />
          <Link
            to="/events"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-fit")}
          >
            <ArrowLeft data-icon="inline-start" aria-hidden />
            {t("events.detail.back")}
          </Link>
        </>
      }
    />
  );
}
