import { RiEyeLine, RiRefreshLine, RiArrowRightLine } from "@remixicon/react";

import { DashboardTable } from "#/app/shell/dashboard-table.tsx";
import { Button } from "#/components/ui/button.tsx";
import { SeverityBadge } from "#/features/events/ui/severity-badge.tsx";
import type { Operations } from "#/features/operations/model/operation-types.ts";

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
      <h3 className="mb-2 text-xs font-semibold">Events</h3>
      <DashboardTable
        empty="No events yet"
        headers={["Title", "Source", "Severity", "Status", "Deliveries", ""]}
        rows={events.map((event) => ({
          key: event.id,
          cells: [
            event.title,
            event.sourceName,
            <SeverityBadge key="severity" severity={event.severity} />,
            event.status,
            `${event.deliveryCounts.pending}/${event.deliveryCounts.running}/${event.deliveryCounts.succeeded}/${event.deliveryCounts.failed}`,
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
