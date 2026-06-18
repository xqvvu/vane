import { Badge } from "#/components/ui/badge.tsx";
import type { Operations } from "#/features/operations/model/operation-types.ts";
import { useTranslations } from "#/i18n/use-i18n.ts";

type EventDeliveryCounts = Operations["events"]["items"][number]["deliveryCounts"];

export function EventDeliveryCountsCell({ counts }: { counts: EventDeliveryCounts }) {
  const total = counts.pending + counts.running + counts.succeeded + counts.failed;

  if (total === 0) {
    return <span className="text-muted-foreground text-xs">0</span>;
  }

  return (
    <div className="flex flex-wrap justify-center gap-1">
      <EventDeliveryStateCount state="pending" value={counts.pending} />
      <EventDeliveryStateCount state="running" value={counts.running} />
      <EventDeliveryStateCount state="succeeded" value={counts.succeeded} />
      <EventDeliveryStateCount state="failed" value={counts.failed} />
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
      className="px-1.5"
    >
      {t(`events.table.deliveryShort.${state}`)}
      <span className="text-muted-foreground">{value}</span>
    </Badge>
  );
}

function deliveryCountVariant(
  state: keyof EventDeliveryCounts,
): "default" | "secondary" | "destructive" | "outline" {
  return state === "failed" ? "destructive" : state === "succeeded" ? "default" : "outline";
}
