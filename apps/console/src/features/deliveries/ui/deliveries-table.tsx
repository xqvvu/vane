import { RiEyeLine, RiInboxArchiveLine, RiRestartLine } from "@remixicon/react";
import type { ColumnDef } from "@tanstack/react-table";
import * as React from "react";

import { HistoryPagination } from "#/components/common/history-pagination.tsx";
import { IconTooltip } from "#/components/common/icon-tooltip.tsx";
import { OperationsTable } from "#/components/common/operations-table.tsx";
import { Button } from "#/components/ui/button.tsx";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "#/components/ui/empty.tsx";
import { DeliveryStateBadge } from "#/features/deliveries/ui/delivery-state-badge.tsx";
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
        cell: ({ row }) => <OperationTimestamp format="time" value={row.original.updatedAt} />,
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

function DeliveryActions({
  delivery,
  pending,
  onInspect,
  onRetry,
}: {
  delivery: Operations["deliveries"]["items"][number];
  pending: boolean;
  onInspect: (deliveryId: string) => void;
  onRetry: (deliveryId: string) => void;
}) {
  const t = useTranslations();
  const retryLabel = t("deliveries.table.retry");
  const inspectLabel = t("deliveries.table.inspect");

  return (
    <div className="flex justify-center gap-1">
      {delivery.state === "failed" ? (
        <IconTooltip label={retryLabel}>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            disabled={pending}
            aria-label={retryLabel}
            onClick={() => onRetry(delivery.id)}
          >
            <RiRestartLine data-icon="inline-start" aria-hidden />
          </Button>
        </IconTooltip>
      ) : null}
      <IconTooltip label={inspectLabel}>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          disabled={pending}
          aria-label={inspectLabel}
          onClick={() => onInspect(delivery.id)}
        >
          <RiEyeLine data-icon="inline-start" aria-hidden />
        </Button>
      </IconTooltip>
    </div>
  );
}

function DeliveryTargetCell({
  destinationName,
  routeName,
}: {
  destinationName: string;
  routeName: string | null;
}) {
  const t = useTranslations();

  return (
    <div className="min-w-0">
      <div className="truncate font-medium" title={destinationName}>
        {destinationName}
      </div>
      <div
        className="text-muted-foreground truncate text-[11px]"
        title={routeName ?? t("deliveries.table.manual")}
      >
        {routeName ?? t("deliveries.table.manual")}
      </div>
    </div>
  );
}

function DeliveryEventCell({ eventId, sourceName }: { eventId: string; sourceName: string }) {
  return (
    <div className="min-w-0">
      <div className="truncate font-medium" title={sourceName}>
        {sourceName}
      </div>
      <div className="text-muted-foreground truncate font-mono text-[11px]" title={eventId}>
        {eventId}
      </div>
    </div>
  );
}

function DeliveriesEmptyState() {
  const t = useTranslations();

  return (
    <Empty className="border-none p-4">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <RiInboxArchiveLine aria-hidden />
        </EmptyMedia>
        <EmptyTitle>{t("deliveries.table.empty")}</EmptyTitle>
        <EmptyDescription>{t("deliveries.table.order")}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

function deliveriesColumnClassName(columnId: string): string | null {
  switch (columnId) {
    case "target":
      return "w-[18%]";
    case "event":
      return "w-[20%]";
    case "state":
      return "w-[10%]";
    case "attempts":
      return "w-[9%]";
    case "next":
      return "w-[10%]";
    case "lastError":
      return "w-[19%]";
    case "updated":
      return "w-[10%]";
    case "actions":
      return "w-[4%]";
    default:
      return null;
  }
}

const deliveriesPageSize = 20;
