import { RiEyeLine, RiInboxArchiveLine } from "@remixicon/react";
import type { ColumnDef } from "@tanstack/react-table";
import * as React from "react";

import { HistoryPagination } from "#/components/common/history-pagination.tsx";
import { IconTooltip } from "#/components/common/icon-tooltip.tsx";
import { OperationsTable } from "#/components/common/operations-table.tsx";
import { Badge } from "#/components/ui/badge.tsx";
import { Button } from "#/components/ui/button.tsx";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "#/components/ui/empty.tsx";
import { SeverityBadge } from "#/features/events/ui/severity-badge.tsx";
import { formatDateTime } from "#/features/operations/model/operation-format.ts";
import type { Operations } from "#/features/operations/model/operation-types.ts";
import { useTranslations } from "#/i18n/use-i18n.ts";

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
  const t = useTranslations();
  const data = React.useMemo(() => events, [events]);
  const columns = React.useMemo<Array<ColumnDef<Operations["events"]["items"][number]>>>(
    () => [
      {
        id: "event",
        header: t("events.table.headers.event"),
        cell: ({ row }) => (
          <EventTitleCell
            title={row.original.title}
            fingerprint={row.original.fingerprint}
            severity={row.original.severity}
          />
        ),
      },
      {
        id: "source",
        header: t("events.table.headers.source"),
        cell: ({ row }) => (
          <span className="block truncate" title={row.original.sourceName}>
            {row.original.sourceName}
          </span>
        ),
      },
      {
        id: "state",
        header: t("events.table.headers.state"),
        cell: ({ row }) => <EventStateCell status={row.original.status} />,
      },
      {
        id: "deliveries",
        header: t("events.table.headers.deliveries"),
        cell: ({ row }) => <DeliveryCountsCell counts={row.original.deliveryCounts} />,
      },
      {
        id: "received",
        header: t("events.table.headers.received"),
        cell: ({ row }) => (
          <span title={formatDateTime(row.original.receivedAt)}>
            {formatDateTime(row.original.receivedAt)}
          </span>
        ),
      },
      {
        id: "actions",
        header: t("events.table.headers.actions"),
        cell: ({ row }) => (
          <EventActions eventId={row.original.id} pending={pending} onInspect={onInspect} />
        ),
      },
    ],
    [onInspect, pending, t],
  );

  return (
    <section className="bg-background flex min-h-0 flex-1 flex-col">
      <OperationsTable
        data={data}
        columns={columns}
        pageSize={eventsPageSize}
        showPagination={false}
        emptyState={<EventsEmptyState />}
        getRowId={(event) => event.id}
        columnClassName={eventsColumnClassName}
        isPrimaryColumn={(columnId) => columnId === "event"}
        rangeLabel={({ total }) => t("events.table.range", { total })}
        emptyRangeLabel={t("events.table.emptyRange")}
        pageLabel={({ page, pageCount }) => t("events.table.page", { page, pageCount })}
        previousLabel={t("events.table.previous")}
        nextLabel={t("events.table.next")}
      />

      <HistoryPagination
        latestLabel={t("operations.history.latest")}
        olderLabel={t("operations.history.older")}
        showLatestLabel={t("operations.history.showLatest")}
        showOlderLabel={t("operations.history.showOlder")}
        hasOlder={nextCursor !== null}
        pending={pending}
        onOlder={nextCursor ? () => onOlder(nextCursor) : undefined}
        onLatest={onLatest}
      />
    </section>
  );
}

function EventActions({
  eventId,
  pending,
  onInspect,
}: {
  eventId: string;
  pending: boolean;
  onInspect: (eventId: string) => void;
}) {
  const t = useTranslations();
  const inspectLabel = t("events.table.inspect");

  return (
    <div className="flex justify-center">
      <IconTooltip label={inspectLabel}>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          disabled={pending}
          aria-label={inspectLabel}
          onClick={() => onInspect(eventId)}
        >
          <RiEyeLine data-icon="inline-start" aria-hidden />
        </Button>
      </IconTooltip>
    </div>
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
  const t = useTranslations();

  return (
    <Badge variant={status === "firing" ? "destructive" : "secondary"}>
      {t(`common.alertStatus.${status}`)}
    </Badge>
  );
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
    <div className="flex flex-wrap justify-center gap-1">
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
  state: keyof Operations["events"]["items"][number]["deliveryCounts"],
): "default" | "secondary" | "destructive" | "outline" {
  return state === "failed" ? "destructive" : state === "succeeded" ? "default" : "outline";
}

function EventsEmptyState() {
  const t = useTranslations();

  return (
    <Empty className="border-none p-4">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <RiInboxArchiveLine aria-hidden />
        </EmptyMedia>
        <EmptyTitle>{t("events.table.empty")}</EmptyTitle>
        <EmptyDescription>{t("events.table.order")}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

function eventsColumnClassName(columnId: string): string | null {
  switch (columnId) {
    case "event":
      return "w-[34%]";
    case "source":
      return "w-[14%]";
    case "state":
      return "w-[10%]";
    case "deliveries":
      return "w-[20%]";
    case "received":
      return "w-[16%]";
    case "actions":
      return "w-[6%]";
    default:
      return null;
  }
}

const eventsPageSize = 20;
