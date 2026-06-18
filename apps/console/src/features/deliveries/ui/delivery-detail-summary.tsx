import type { ReactNode } from "react";

import { Badge } from "#/components/ui/badge.tsx";
import type { DeliveryDetailData } from "#/features/deliveries/ui/delivery-detail-types.ts";
import { DeliveryStateBadge } from "#/features/deliveries/ui/delivery-state-badge.tsx";
import { OperationTimestamp } from "#/features/operations/ui/operation-timestamp.tsx";
import { useTranslations } from "#/i18n/use-i18n.ts";
import { cn } from "#/lib/utils.ts";

export function DeliveryDetailSummary({ detail }: { detail: DeliveryDetailData }) {
  const t = useTranslations();

  return (
    <section className="border-border bg-card shrink-0 border">
      <div className="border-border flex flex-col gap-3 border-b p-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex min-w-0 flex-wrap items-center gap-1.5">
            <DeliveryStateBadge state={detail.job.state} />
            <Badge variant="outline">
              {t("deliveries.detail.attemptCount", {
                attemptCount: detail.job.attemptCount,
                maxAttempts: detail.job.maxAttempts,
              })}
            </Badge>
          </div>
          <h2 className="text-sm leading-5 font-semibold wrap-break-word">
            {detail.destination.name}
          </h2>
          <p className="text-muted-foreground mt-1 max-w-4xl text-xs leading-5 wrap-break-word">
            {detail.source.name} / {detail.route?.name ?? t("deliveries.detail.manual")} /{" "}
            {detail.event.normalized.title}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-1">
          <Badge variant="outline">{t(`destinations.kinds.${detail.destination.kind}`)}</Badge>
          <Badge variant={detail.job.lastError ? "destructive" : "outline"}>
            {detail.job.lastError ?? t("deliveries.detail.summary.noLastError")}
          </Badge>
        </div>
      </div>
      <div className="bg-border grid gap-px sm:grid-cols-2 lg:grid-cols-5">
        <SummaryMetric
          label={t("deliveries.detail.terms.destination")}
          value={detail.destination.name}
        />
        <SummaryMetric
          label={t("deliveries.detail.terms.route")}
          value={detail.route?.name ?? t("deliveries.detail.manual")}
        />
        <SummaryMetric label={t("deliveries.detail.terms.source")} value={detail.source.name} />
        <SummaryMetric
          label={t("deliveries.detail.terms.nextAttempt")}
          value={
            detail.job.nextAttemptAt ? (
              <OperationTimestamp format="dateTime" value={detail.job.nextAttemptAt} />
            ) : (
              "-"
            )
          }
        />
        <SummaryMetric
          label={t("deliveries.detail.terms.attempts")}
          value={`${detail.job.attemptCount}/${detail.job.maxAttempts}`}
          mono
        />
      </div>
    </section>
  );
}

function SummaryMetric({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="bg-card min-w-0 px-3 py-2.5">
      <div className="text-muted-foreground text-[11px]">{label}</div>
      <div
        className={cn(
          "mt-1 text-xs leading-4 font-medium wrap-break-word",
          mono ? "font-mono text-[11px]" : null,
        )}
      >
        {value}
      </div>
    </div>
  );
}
