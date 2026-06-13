import { RiArrowLeftLine, RiErrorWarningLine } from "@remixicon/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import { Alert, AlertDescription, AlertTitle } from "#/components/ui/alert.tsx";
import { Badge } from "#/components/ui/badge.tsx";
import { buttonVariants } from "#/components/ui/button.tsx";
import { EventDetailView } from "#/features/events/ui/event-detail-view.tsx";
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
          <EventDetailPageToolbar eventId={eventId} />
          <div className="p-3">
            {detail ? (
              <section className="border-border bg-background border p-3">
                <EventDetailView detail={detail} />
              </section>
            ) : (
              <Alert variant="destructive">
                <RiErrorWarningLine aria-hidden />
                <AlertTitle>{t("events.detail.notFoundTitle")}</AlertTitle>
                <AlertDescription>{t("events.detail.notFoundDescription")}</AlertDescription>
              </Alert>
            )}
          </div>
        </>
      }
    />
  );
}

function EventDetailPageToolbar({ eventId }: { eventId: string }) {
  const t = useTranslations();

  return (
    <header className="border-border bg-background flex flex-col gap-3 border-b px-3 py-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <h1 className="font-heading text-2xl leading-none font-semibold">
            {t("events.detail.title")}
          </h1>
          <Badge variant="outline" className="max-w-48 truncate font-mono text-[10px]">
            {eventId}
          </Badge>
        </div>
        <p className="text-muted-foreground mt-2 text-sm">{t("events.detail.description")}</p>
      </div>
      <Link
        to="/events"
        className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-fit")}
      >
        <RiArrowLeftLine data-icon="inline-start" aria-hidden />
        {t("events.detail.back")}
      </Link>
    </header>
  );
}
