import { useSuspenseQueries, useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { toast } from "sonner";

import { OperationalSummary } from "#/features/configuration/ui/operational-summary";
import { destinationsQueryOptions } from "#/features/destinations/api/destination.queries";
import { EventsPageToolbar } from "#/features/events/ui/events-page-toolbar";
import { EventsTable } from "#/features/events/ui/events-table";
import { useOperationMutations } from "#/features/operations/api/operation.mutations";
import { operationsQueryOptions } from "#/features/operations/api/operations.queries";
import type {
  DashboardOperationSearch,
  OperationFilterData,
} from "#/features/operations/model/operation-search";
import { OperationFilters } from "#/features/operations/ui/operation-filters";
import { routesQueryOptions } from "#/features/routes/api/route.queries";
import { sourcesQueryOptions } from "#/features/sources/api/source.queries";
import { useTranslations } from "#/i18n/use-i18n";
import { DashboardContentLayout } from "#/shell/dashboard-layout";
import { DashboardSidebar } from "#/shell/dashboard-sidebar";

export interface EventsPageProps {
  search: DashboardOperationSearch;
  filters: OperationFilterData;
  onSearchChange: (next: Partial<DashboardOperationSearch>) => void;
}

export function EventsPage({ search, filters, onSearchChange }: EventsPageProps) {
  const t = useTranslations();
  const navigate = useNavigate();
  const [{ data: sources }, { data: destinations }, { data: routes }] = useSuspenseQueries({
    queries: [sourcesQueryOptions(), destinationsQueryOptions(), routesQueryOptions()],
  });
  const { data: operations } = useSuspenseQuery(operationsQueryOptions(filters));
  const operationConfiguration = { sources, destinations };
  const { invalidateOperations } = useOperationMutations();
  const [pendingAction, setPendingAction] = React.useState<string | null>(null);
  const pending = pendingAction !== null;

  async function refreshOperations() {
    setPendingAction("refresh-events");

    try {
      await invalidateOperations();
    } catch (error) {
      toast.error(t("events.page.operationFailed"), {
        description: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setPendingAction(null);
    }
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

  return (
    <DashboardContentLayout
      main={
        <>
          <EventsPageToolbar
            pending={pending}
            onRefresh={() => void refreshOperations()}
            onResetFilters={resetFilters}
          />
          <EventsTable
            events={operations.events.items}
            page={operations.events.page}
            pageSize={operations.events.pageSize}
            total={operations.events.total}
            pending={pending}
            onInspect={(eventId) =>
              void navigate({
                to: "/events/$eventId",
                params: {
                  eventId,
                },
              })
            }
            onPageChange={(eventPage) => onSearchChange({ eventPage })}
          />
        </>
      }
      sidebar={
        <DashboardSidebar variant="split">
          <OperationFilters
            configuration={operationConfiguration}
            search={search}
            pending={pending}
            onChange={onSearchChange}
            layout="rail"
          />
          <OperationalSummary
            sources={sources}
            destinations={destinations}
            routes={routes}
            layout="rail"
          />
        </DashboardSidebar>
      }
    />
  );
}
