import { Badge } from "#/components/ui/badge";
import type { Operations } from "#/features/operations/model/operation-types";
import { useTranslations } from "#/i18n/use-i18n";

type EventDeliveryCounts = Operations["events"]["items"][number]["deliveryCounts"];

export function EventDeliveryCountsCell({
  counts,
  routeMatchCount,
}: {
  counts: EventDeliveryCounts;
  routeMatchCount: number;
}) {
  const t = useTranslations();
  const total = counts.pending + counts.running + counts.succeeded + counts.failed;

  if (total === 0 && routeMatchCount === 0) {
    return (
      <div className="flex justify-center">
        <Badge variant="outline" title={t("events.table.unmatchedRoutesTitle")}>
          {t("events.table.unmatchedRoutes")}
        </Badge>
      </div>
    );
  }

  if (total === 0) {
    return (
      <div className="flex justify-center">
        <Badge variant="outline" className="min-w-8 justify-center font-mono tabular-nums">
          0
        </Badge>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-wrap justify-center gap-1">
      <EventDeliveryStateCount state="failed" value={counts.failed} />
      <EventDeliveryStateCount state="running" value={counts.running} />
      <EventDeliveryStateCount state="pending" value={counts.pending} />
      <EventDeliveryStateCount state="succeeded" value={counts.succeeded} />
    </div>
  );
}

function EventDeliveryStateCount({
  state,
  value,
}: {
  state: keyof EventDeliveryCounts;
  value: number;
}) {
  const t = useTranslations();

  if (value === 0) {
    return null;
  }

  return (
    <Badge
      variant={deliveryCountVariant(state)}
      title={`${t(`common.deliveryState.${state}`)}: ${value}`}
      className="min-w-12 justify-center gap-1 px-1.5"
    >
      {t(`common.deliveryState.${state}`)}
      <span className="self-baseline font-mono tabular-nums">{value}</span>
    </Badge>
  );
}

function deliveryCountVariant(
  state: keyof EventDeliveryCounts,
): "default" | "secondary" | "destructive" | "outline" {
  return state === "failed" ? "destructive" : state === "succeeded" ? "default" : "outline";
}
