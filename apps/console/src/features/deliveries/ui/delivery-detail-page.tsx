import { RiArrowLeftLine, RiErrorWarningLine } from "@remixicon/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import { Alert, AlertDescription, AlertTitle } from "#/components/ui/alert.tsx";
import { Badge } from "#/components/ui/badge.tsx";
import { buttonVariants } from "#/components/ui/button.tsx";
import { DeliveryDetailView } from "#/features/deliveries/ui/delivery-detail-view.tsx";
import { deliveryDetailQueryOptions } from "#/features/operations/api/operations.queries.ts";
import { useTranslations } from "#/i18n/use-i18n.ts";
import { cn } from "#/lib/utils.ts";
import { DashboardContentLayout } from "#/shell/dashboard-layout.tsx";

export function DeliveryDetailPage({ deliveryId }: { deliveryId: string }) {
  const t = useTranslations();
  const { data: detail } = useSuspenseQuery(deliveryDetailQueryOptions(deliveryId));

  return (
    <DashboardContentLayout
      main={
        <>
          <DeliveryDetailPageToolbar deliveryId={deliveryId} />
          <div className="p-3">
            {detail ? (
              <section className="border-border bg-background border p-3">
                <DeliveryDetailView detail={detail} />
              </section>
            ) : (
              <Alert variant="destructive">
                <RiErrorWarningLine aria-hidden />
                <AlertTitle>{t("deliveries.detail.notFoundTitle")}</AlertTitle>
                <AlertDescription>{t("deliveries.detail.notFoundDescription")}</AlertDescription>
              </Alert>
            )}
          </div>
        </>
      }
    />
  );
}

function DeliveryDetailPageToolbar({ deliveryId }: { deliveryId: string }) {
  const t = useTranslations();

  return (
    <header className="border-border bg-background flex flex-col gap-3 border-b px-3 py-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <h1 className="font-heading text-2xl leading-none font-semibold">
            {t("deliveries.detail.title")}
          </h1>
          <Badge variant="outline" className="max-w-48 truncate font-mono text-[10px]">
            {deliveryId}
          </Badge>
        </div>
        <p className="text-muted-foreground mt-2 text-sm">{t("deliveries.detail.description")}</p>
      </div>
      <Link
        to="/deliveries"
        className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-fit")}
      >
        <RiArrowLeftLine data-icon="inline-start" aria-hidden />
        {t("deliveries.detail.back")}
      </Link>
    </header>
  );
}
