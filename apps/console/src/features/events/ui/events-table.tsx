import type { ColumnDef } from "@tanstack/react-table";
import * as React from "react";

import { OperationsTable } from "#/components/common/operations-table.tsx";
import { TablePagination } from "#/components/common/table-pagination.tsx";
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
  page,
  pageSize,
  total,
  pending,
  onInspect,
  onPageChange,
}: {
  events: Operations["events"]["items"];
  page: number;
  pageSize: number;
  total: number;
  pending: boolean;
  onInspect: (eventId: string) => void;
  onPageChange: (page: number) => void;
}) {
  const t = useTranslations();
  const data = React.useMemo(() => events, [events]);
  const normalizedPageSize = Math.max(pageSize, 1);
  const pageCount = Math.max(Math.ceil(total / normalizedPageSize), 1);
  const pageIndex = Math.min(Math.max(page - 1, 0), pageCount - 1);
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
        cell: ({ row }) => (
          <EventDeliveryCountsCell
            counts={row.original.deliveryCounts}
            routeMatchCount={row.original.routeMatchCount}
          />
        ),
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

      <TablePagination
        rangeLabel={total > 0 ? t("events.table.range", { total }) : t("events.table.emptyRange")}
        pageLabel={t("events.table.page", {
          page: pageIndex + 1,
          pageCount,
        })}
        previousLabel={t("events.table.previous")}
        nextLabel={t("events.table.next")}
        pageIndex={pageIndex}
        pageCount={pageCount}
        onPageIndexChange={(nextPageIndex) => onPageChange(nextPageIndex + 1)}
      />
    </section>
  );
}
