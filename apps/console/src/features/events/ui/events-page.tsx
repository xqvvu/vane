import { useSuspenseQuery } from "@tanstack/react-query";
import * as React from "react";

import { DashboardContentLayout } from "#/app/shell/dashboard-layout.tsx";
import { DashboardSidebar } from "#/app/shell/dashboard-sidebar.tsx";
import { configurationQueryOptions } from "#/features/configuration/api/configuration.queries.ts";
import { OperationalSummary } from "#/features/configuration/ui/operational-summary.tsx";
import { EventsTable } from "#/features/events/ui/events-table.tsx";
import { useOperationMutations } from "#/features/operations/api/operation.mutations.ts";
import { operationsQueryOptions } from "#/features/operations/api/operations.queries.ts";
import type {
  DashboardOperationSearch,
  OperationFilterData,
} from "#/features/operations/model/operation-search.ts";
import type { EventDetail } from "#/features/operations/model/operation-types.ts";
import { DetailPanel } from "#/features/operations/ui/detail-panel.tsx";
import { OperationFilters } from "#/features/operations/ui/operation-filters.tsx";

export interface EventsPageProps {
  search: DashboardOperationSearch;
  filters: OperationFilterData;
  onSearchChange: (next: Partial<DashboardOperationSearch>) => void;
}

export function EventsPage({ search, filters, onSearchChange }: EventsPageProps) {
  const { data: configuration } = useSuspenseQuery(configurationQueryOptions());
  const { data: operations } = useSuspenseQuery(operationsQueryOptions(filters));
  const { getEventDetail, invalidateOperations } = useOperationMutations();
  const [eventDetail, setEventDetail] = React.useState<EventDetail | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [pendingAction, setPendingAction] = React.useState<string | null>(null);
  const pending = pendingAction !== null;

  async function refreshOperations() {
    await invalidateOperations();
  }

  async function submitAction<T>(action: string, fn: () => Promise<T>): Promise<T | null> {
    setPendingAction(action);
    setFormError(null);

    try {
      const result = await fn();
      await refreshOperations();
      return result;
    } catch (error) {
      setFormError(error instanceof Error ? error.message : String(error));
      return null;
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <DashboardContentLayout
      main={
        <>
          {formError ? (
            <div className="border-destructive/40 bg-destructive/10 text-destructive border px-3 py-2 text-xs">
              {formError}
            </div>
          ) : null}
          <EventsTable
            events={operations.events.items}
            nextCursor={operations.events.nextCursor}
            pending={pending}
            onInspect={(eventId) =>
              void submitAction(`inspect-event-${eventId}`, async () => {
                const result = await getEventDetail({
                  data: {
                    id: eventId,
                  },
                });
                setEventDetail(result);
                return result;
              })
            }
            onOlder={(cursor) => onSearchChange({ eventCursor: cursor })}
            onLatest={() => onSearchChange({ eventCursor: "" })}
          />
          <DetailPanel eventDetail={eventDetail} deliveryDetail={null} />
        </>
      }
      sidebar={
        <DashboardSidebar>
          <OperationFilters
            configuration={configuration}
            search={search}
            pending={pending}
            onChange={onSearchChange}
          />
          <OperationalSummary configuration={configuration} />
        </DashboardSidebar>
      }
    />
  );
}
