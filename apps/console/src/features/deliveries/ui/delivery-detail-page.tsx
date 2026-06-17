import { RiArrowLeftLine, RiErrorWarningLine } from "@remixicon/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import { PageToolbar } from "#/components/common/page-toolbar.tsx";
import { Alert, AlertDescription, AlertTitle } from "#/components/ui/alert.tsx";
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
        </>
      }
    />
  );
}

function DeliveryDetailPageToolbar({ deliveryId }: { deliveryId: string }) {
  const t = useTranslations();

  return (
    <PageToolbar
      description={t("deliveries.detail.description")}
      badge={deliveryId}
      actions={
        <Link
          to="/deliveries"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-fit")}
        >
          <RiArrowLeftLine data-icon="inline-start" aria-hidden />
          {t("deliveries.detail.back")}
        </Link>
      }
    />
  );
}
