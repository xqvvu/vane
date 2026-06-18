import type { ColumnDef } from "@tanstack/react-table";
import * as React from "react";

import { HistoryPagination } from "#/components/common/history-pagination.tsx";
import { OperationsTable } from "#/components/common/operations-table.tsx";
import { EventActions } from "#/features/events/ui/event-actions.tsx";
import { EventDeliveryCountsCell } from "#/features/events/ui/event-delivery-counts-cell.tsx";
import { EventStateCell } from "#/features/events/ui/event-state-cell.tsx";
import { EventTitleCell } from "#/features/events/ui/event-title-cell.tsx";
import { EventsEmptyState } from "#/features/events/ui/events-empty-state.tsx";
import {
  eventsColumnClassName,
  eventsPageSize,
  eventsTableMinWidthClassName,
} from "#/features/events/ui/events-table-layout.ts";
import type { Operations } from "#/features/operations/model/operation-types.ts";
import { OperationTimestamp } from "#/features/operations/ui/operation-timestamp.tsx";
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
        cell: ({ row }) => <EventDeliveryCountsCell counts={row.original.deliveryCounts} />,
      },
      {
        id: "received",
        header: t("events.table.headers.received"),
        cell: ({ row }) => <OperationTimestamp format="dateTime" value={row.original.receivedAt} />,
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
        minWidthClassName={eventsTableMinWidthClassName}
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
