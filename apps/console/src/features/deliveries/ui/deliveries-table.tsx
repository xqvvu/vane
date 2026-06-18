import type { ColumnDef } from "@tanstack/react-table";
import * as React from "react";

import { HistoryPagination } from "#/components/common/history-pagination.tsx";
import { OperationsTable } from "#/components/common/operations-table.tsx";
import { DeliveriesEmptyState } from "#/features/deliveries/ui/deliveries-empty-state.tsx";
import {
  deliveriesColumnClassName,
  deliveriesPageSize,
  deliveriesTableMinWidthClassName,
} from "#/features/deliveries/ui/deliveries-table-layout.ts";
import { DeliveryActions } from "#/features/deliveries/ui/delivery-actions.tsx";
import { DeliveryEventCell } from "#/features/deliveries/ui/delivery-event-cell.tsx";
import { DeliveryStateBadge } from "#/features/deliveries/ui/delivery-state-badge.tsx";
import { DeliveryTargetCell } from "#/features/deliveries/ui/delivery-target-cell.tsx";
import type { Operations } from "#/features/operations/model/operation-types.ts";
import { OperationTimestamp } from "#/features/operations/ui/operation-timestamp.tsx";
import { useTranslations } from "#/i18n/use-i18n.ts";

export function DeliveriesTable({
  deliveries,
  nextCursor,
  pending,
  onInspect,
  onRetry,
  onOlder,
  onLatest,
}: {
  deliveries: Operations["deliveries"]["items"];
  nextCursor: string | null;
  pending: boolean;
  onInspect: (deliveryId: string) => void;
  onRetry: (deliveryId: string) => void;
  onOlder: (cursor: string) => void;
  onLatest: () => void;
}) {
  const t = useTranslations();
  const data = React.useMemo(() => deliveries, [deliveries]);
  const columns = React.useMemo<Array<ColumnDef<Operations["deliveries"]["items"][number]>>>(
    () => [
      {
        id: "target",
        header: t("deliveries.table.headers.target"),
        cell: ({ row }) => (
          <DeliveryTargetCell
            destinationName={row.original.destinationName}
            routeName={row.original.routeName}
          />
        ),
      },
      {
        id: "event",
        header: t("deliveries.table.headers.event"),
        cell: ({ row }) => (
          <DeliveryEventCell eventId={row.original.eventId} sourceName={row.original.sourceName} />
        ),
      },
      {
        id: "state",
        header: t("deliveries.table.headers.state"),
        cell: ({ row }) => <DeliveryStateBadge state={row.original.state} />,
      },
      {
        id: "attempts",
        header: t("deliveries.table.headers.attempts"),
        cell: ({ row }) => <span className="font-medium">{row.original.attemptCount}</span>,
      },
      {
        id: "next",
        header: t("deliveries.table.headers.next"),
        cell: ({ row }) =>
          row.original.nextAttemptAt ? (
            <OperationTimestamp format="time" value={row.original.nextAttemptAt} />
          ) : (
            "—"
          ),
      },
      {
        id: "lastError",
        header: t("deliveries.table.headers.lastError"),
        cell: ({ row }) => (
          <span className="block truncate" title={row.original.lastError ?? undefined}>
            {row.original.lastError ?? "—"}
          </span>
        ),
      },
      {
        id: "updated",
        header: t("deliveries.table.headers.updated"),
        cell: ({ row }) => <OperationTimestamp format="dateTime" value={row.original.updatedAt} />,
      },
      {
        id: "actions",
        header: t("deliveries.table.headers.actions"),
        cell: ({ row }) => (
          <DeliveryActions
            delivery={row.original}
            pending={pending}
            onInspect={onInspect}
            onRetry={onRetry}
          />
        ),
      },
    ],
    [onInspect, onRetry, pending, t],
  );

  return (
    <section className="bg-background flex min-h-0 flex-1 flex-col">
      <OperationsTable
        data={data}
        columns={columns}
        pageSize={deliveriesPageSize}
        showPagination={false}
        minWidthClassName={deliveriesTableMinWidthClassName}
        emptyState={<DeliveriesEmptyState />}
        getRowId={(delivery) => delivery.id}
        columnClassName={deliveriesColumnClassName}
        isPrimaryColumn={(columnId) => columnId === "target"}
        rangeLabel={({ total }) => t("deliveries.table.range", { total })}
        emptyRangeLabel={t("deliveries.table.emptyRange")}
        pageLabel={({ page, pageCount }) => t("deliveries.table.page", { page, pageCount })}
        previousLabel={t("deliveries.table.previous")}
        nextLabel={t("deliveries.table.next")}
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
