import { RiArrowRightLine, RiEyeLine, RiRefreshLine, RiRestartLine } from "@remixicon/react";

import { DashboardTable } from "#/app/shell/dashboard-table.tsx";
import { Button } from "#/components/ui/button.tsx";
import { DeliveryStateBadge } from "#/features/deliveries/ui/delivery-state-badge.tsx";
import { formatTime } from "#/features/operations/model/operation-format.ts";
import type { Operations } from "#/features/operations/model/operation-types.ts";

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
      <h3 className="mb-2 text-xs font-semibold">Deliveries</h3>
      <DashboardTable
        empty="No deliveries yet"
        headers={["Destination", "Route", "State", "Attempts", "Next", ""]}
        rows={deliveries.map((delivery) => ({
          key: delivery.id,
          cells: [
            delivery.destinationName,
            delivery.routeName ?? "Manual",
            <DeliveryStateBadge key="state" state={delivery.state} />,
            delivery.attemptCount,
            delivery.nextAttemptAt ? formatTime(delivery.nextAttemptAt) : "—",
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
        <RiRefreshLine aria-hidden />
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
        <RiArrowRightLine aria-hidden />
      </Button>
    </div>
  );
}
