import { RiArrowRightLine, RiEyeLine, RiRefreshLine, RiRestartLine } from "@remixicon/react";

import { Button } from "#/components/ui/button.tsx";
import { DeliveryStateBadge } from "#/features/deliveries/ui/delivery-state-badge.tsx";
import { formatDateTime, formatTime } from "#/features/operations/model/operation-format.ts";
import type { Operations } from "#/features/operations/model/operation-types.ts";
import { DashboardTable } from "#/shell/dashboard-table.tsx";

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
  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="text-xs font-semibold">Delivery jobs</h3>
        <span className="text-muted-foreground text-xs">Newest updated first</span>
      </div>
      <DashboardTable
        empty="No deliveries yet"
        headers={["Target", "Event", "State", "Attempts", "Next", "Last error", "Updated", ""]}
        columnClassNames={[
          "w-[18%]",
          "w-[20%]",
          "w-[10%]",
          "w-[9%]",
          "w-[10%]",
          "w-[19%]",
          "w-[10%]",
          "w-[4%]",
        ]}
        rows={deliveries.map((delivery) => ({
          key: delivery.id,
          cells: [
            <DeliveryTargetCell
              key="target"
              destinationName={delivery.destinationName}
              routeName={delivery.routeName}
            />,
            <DeliveryEventCell
              key="event"
              eventId={delivery.eventId}
              sourceName={delivery.sourceName}
            />,
            <DeliveryStateBadge key="state" state={delivery.state} />,
            <span key="attempts" className="font-medium">
              {delivery.attemptCount}
            </span>,
            delivery.nextAttemptAt ? formatTime(delivery.nextAttemptAt) : "—",
            <span key="error" className="truncate" title={delivery.lastError ?? undefined}>
              {delivery.lastError ?? "—"}
            </span>,
            <span key="updated" title={formatDateTime(delivery.updatedAt)}>
              {formatTime(delivery.updatedAt)}
            </span>,
            <div key="actions" className="flex justify-end gap-1">
              {delivery.state === "failed" ? (
                <Button
                  variant="outline"
                  size="icon-xs"
                  disabled={pending}
                  title="Retry delivery"
                  onClick={() => onRetry(delivery.id)}
                >
                  <RiRestartLine aria-hidden />
                </Button>
              ) : null}
              <Button
                variant="outline"
                size="icon-xs"
                disabled={pending}
                title="Inspect delivery"
                onClick={() => onInspect(delivery.id)}
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

function DeliveryTargetCell({
  destinationName,
  routeName,
}: {
  destinationName: string;
  routeName: string | null;
}) {
  return (
    <div className="min-w-0">
      <div className="truncate font-medium" title={destinationName}>
        {destinationName}
      </div>
      <div className="text-muted-foreground truncate text-[11px]" title={routeName ?? "Manual"}>
        {routeName ?? "Manual"}
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
