import { RiErrorWarningLine, RiFilterOffLine, RiRefreshLine } from "@remixicon/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import * as React from "react";

import { Alert, AlertDescription, AlertTitle } from "#/components/ui/alert.tsx";
import { Badge } from "#/components/ui/badge.tsx";
import { Button } from "#/components/ui/button.tsx";
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
import { DashboardContentLayout } from "#/shell/dashboard-layout.tsx";
import { DashboardSidebar } from "#/shell/dashboard-sidebar.tsx";

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

  function resetFilters() {
    onSearchChange({
      sourceId: "",
      severity: "",
      status: "",
      destinationId: "",
      deliveryState: "",
      q: "",
    });
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
      variant="split"
      main={
        <>
          <EventsPageToolbar
            eventCount={operations.events.items.length}
            pending={pending}
            onRefresh={() => void refreshOperations()}
            onResetFilters={resetFilters}
          />
          {formError ? (
            <Alert variant="destructive" className="mx-3 mt-4">
              <RiErrorWarningLine aria-hidden />
              <AlertTitle>Operation failed</AlertTitle>
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
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
        <DashboardSidebar variant="split">
          <OperationFilters
            configuration={configuration}
            search={search}
            pending={pending}
            onChange={onSearchChange}
            layout="rail"
          />
          <OperationalSummary configuration={configuration} layout="rail" />
        </DashboardSidebar>
      }
    />
  );
}

function EventsPageToolbar({
  eventCount,
  pending,
  onRefresh,
  onResetFilters,
}: {
  eventCount: number;
  pending: boolean;
  onRefresh: () => void;
  onResetFilters: () => void;
}) {
  return (
    <header className="border-border bg-background flex flex-col gap-3 border-b px-3 py-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h1 className="font-heading text-2xl leading-none font-semibold">Events</h1>
          <Badge variant="outline" className="text-[10px] font-bold tracking-wider uppercase">
            {eventCount} loaded
          </Badge>
        </div>
        <p className="text-muted-foreground mt-2 text-sm">
          Triage normalized alerts, route matches, delivery jobs, and redacted raw debug data.
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={onRefresh}
          title="Refresh event history"
        >
          <RiRefreshLine data-icon="inline-start" aria-hidden />
          Refresh
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={onResetFilters}
          title="Reset event filters"
        >
          <RiFilterOffLine data-icon="inline-start" aria-hidden />
          Reset filters
        </Button>
      </div>
    </header>
  );
}
