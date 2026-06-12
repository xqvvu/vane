import { RiArrowRightLine, RiEyeLine, RiRefreshLine } from "@remixicon/react";

import { Badge } from "#/components/ui/badge.tsx";
import { Button } from "#/components/ui/button.tsx";
import { SeverityBadge } from "#/features/events/ui/severity-badge.tsx";
import { formatDateTime } from "#/features/operations/model/operation-format.ts";
import type { Operations } from "#/features/operations/model/operation-types.ts";
import { DashboardTable } from "#/shell/dashboard-table.tsx";

export function EventsTable({
  events,
  nextCursor,
  pending,
  onInspect,
  onOlder,
  onLatest,
}: {
  events: Operations["events"]["items"];
  nextCursor: string | null;
  pending: boolean;
  onInspect: (eventId: string) => void;
  onOlder: (cursor: string) => void;
  onLatest: () => void;
}) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="text-xs font-semibold">Event stream</h3>
        <span className="text-muted-foreground text-xs">Newest first</span>
      </div>
      <DashboardTable
        empty="No events yet"
        headers={["Event", "Source", "State", "Deliveries", "Received", ""]}
        columnClassNames={["w-[34%]", "w-[14%]", "w-[10%]", "w-[20%]", "w-[16%]", "w-[6%]"]}
        rows={events.map((event) => ({
          key: event.id,
          cells: [
            <EventTitleCell
              key="event"
              title={event.title}
              fingerprint={event.fingerprint}
              severity={event.severity}
            />,
            <span key="source" className="truncate" title={event.sourceName}>
              {event.sourceName}
            </span>,
            <EventStateCell key="state" status={event.status} />,
            <DeliveryCountsCell key="deliveries" counts={event.deliveryCounts} />,
            <span key="received" title={formatDateTime(event.receivedAt)}>
              {formatDateTime(event.receivedAt)}
            </span>,
            <div key="actions" className="flex justify-end">
              <Button
                variant="outline"
                size="icon-xs"
                disabled={pending}
                title="Inspect event"
                onClick={() => onInspect(event.id)}
              >
                <RiEyeLine aria-hidden />
              </Button>
            </div>,
          ],
        }))}
      />
      <HistoryPaginationControls
        hasPrevious={nextCursor !== null}
        pending={pending}
        onOlder={nextCursor ? () => onOlder(nextCursor) : undefined}
        onLatest={onLatest}
      />
    </section>
  );
}

function EventTitleCell({
  title,
  fingerprint,
  severity,
}: {
  title: string;
  fingerprint: string;
  severity: Operations["events"]["items"][number]["severity"];
}) {
  return (
    <div className="min-w-0">
      <div className="mb-1 flex min-w-0 items-center gap-1.5">
        <SeverityBadge severity={severity} />
        <span className="truncate font-medium" title={title}>
          {title}
        </span>
      </div>
      <div className="text-muted-foreground truncate text-[11px]" title={fingerprint}>
        {fingerprint}
      </div>
    </div>
  );
}

function EventStateCell({ status }: { status: Operations["events"]["items"][number]["status"] }) {
  return <Badge variant={status === "firing" ? "destructive" : "secondary"}>{status}</Badge>;
}

function DeliveryCountsCell({
  counts,
}: {
  counts: Operations["events"]["items"][number]["deliveryCounts"];
}) {
  const total = counts.pending + counts.running + counts.succeeded + counts.failed;

  if (total === 0) {
    return <span className="text-muted-foreground text-xs">0</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      <DeliveryStateCount state="pending" value={counts.pending} />
      <DeliveryStateCount state="running" value={counts.running} />
      <DeliveryStateCount state="succeeded" value={counts.succeeded} />
      <DeliveryStateCount state="failed" value={counts.failed} />
    </div>
  );
}

function DeliveryStateCount({
  state,
  value,
}: {
  state: keyof Operations["events"]["items"][number]["deliveryCounts"];
  value: number;
}) {
  if (value === 0) {
    return null;
  }

  return (
    <Badge
      variant={deliveryCountVariant(state)}
      title={`${deliveryCountLabel(state)}: ${value}`}
      className="px-1.5"
    >
      {deliveryCountShortLabel(state)}
      <span className="text-muted-foreground">{value}</span>
    </Badge>
  );
}

function deliveryCountShortLabel(
  state: keyof Operations["events"]["items"][number]["deliveryCounts"],
): string {
  return {
    pending: "P",
    running: "R",
    succeeded: "S",
    failed: "F",
  }[state];
}

function deliveryCountLabel(
  state: keyof Operations["events"]["items"][number]["deliveryCounts"],
): string {
  return {
    pending: "Pending",
    running: "Running",
    succeeded: "Succeeded",
    failed: "Failed",
  }[state];
}

function deliveryCountVariant(
  state: keyof Operations["events"]["items"][number]["deliveryCounts"],
): "default" | "secondary" | "destructive" | "outline" {
  return state === "failed" ? "destructive" : state === "succeeded" ? "default" : "outline";
}

function HistoryPaginationControls({
  hasPrevious,
  pending,
  onOlder,
  onLatest,
}: {
  hasPrevious: boolean;
  pending: boolean;
  onOlder?: () => void;
  onLatest: () => void;
}) {
  return (
    <div className="mt-2 flex items-center justify-end gap-1">
      <Button
        type="button"
        variant="outline"
        size="xs"
        disabled={pending}
        onClick={onLatest}
        title="Show latest history"
      >
        <RiRefreshLine data-icon="inline-start" aria-hidden />
        Latest
      </Button>
      <Button
        type="button"
        variant="outline"
        size="xs"
        disabled={pending || !hasPrevious || !onOlder}
        onClick={onOlder}
        title="Show older history"
      >
        Older
        <RiArrowRightLine data-icon="inline-end" aria-hidden />
      </Button>
    </div>
  );
}
