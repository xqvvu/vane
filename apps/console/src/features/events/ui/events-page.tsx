import { RiErrorWarningLine, RiFilterOffLine, RiRefreshLine } from "@remixicon/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import * as React from "react";

import { PageToolbar } from "#/components/common/page-toolbar.tsx";
import { Alert, AlertDescription, AlertTitle } from "#/components/ui/alert.tsx";
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
import { OperationFilters } from "#/features/operations/ui/operation-filters.tsx";
import { useTranslations } from "#/i18n/use-i18n.ts";
import { DashboardContentLayout } from "#/shell/dashboard-layout.tsx";
import { DashboardSidebar } from "#/shell/dashboard-sidebar.tsx";

export interface EventsPageProps {
  search: DashboardOperationSearch;
  filters: OperationFilterData;
  onSearchChange: (next: Partial<DashboardOperationSearch>) => void;
}

export function EventsPage({ search, filters, onSearchChange }: EventsPageProps) {
  const t = useTranslations();
  const navigate = useNavigate();
  const { data: configuration } = useSuspenseQuery(configurationQueryOptions());
  const { data: operations } = useSuspenseQuery(operationsQueryOptions(filters));
  const { invalidateOperations } = useOperationMutations();
  const [formError, setFormError] = React.useState<string | null>(null);
  const [pendingAction, setPendingAction] = React.useState<string | null>(null);
  const pending = pendingAction !== null;

  async function refreshOperations() {
    setPendingAction("refresh-events");
    setFormError(null);

    try {
      await invalidateOperations();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : String(error));
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
          {formError ? (
            <Alert variant="destructive" className="mx-3 mt-4">
              <RiErrorWarningLine aria-hidden />
              <AlertTitle>{t("events.page.operationFailed")}</AlertTitle>
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          ) : null}
          <EventsTable
            events={operations.events.items}
            nextCursor={operations.events.nextCursor}
            pending={pending}
            onInspect={(eventId) =>
              void navigate({
                to: "/events/$eventId",
                params: {
                  eventId,
                },
              })
            }
            onOlder={(cursor) => onSearchChange({ eventCursor: cursor })}
            onLatest={() => onSearchChange({ eventCursor: "" })}
          />
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
  pending,
  onRefresh,
  onResetFilters,
}: {
  pending: boolean;
  onRefresh: () => void;
  onResetFilters: () => void;
}) {
  const t = useTranslations();

  return (
    <PageToolbar
      description={t("events.page.description")}
      actions={
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={onRefresh}
            title={t("events.page.refreshTitle")}
          >
            <RiRefreshLine data-icon="inline-start" aria-hidden />
            {t("common.actions.refresh")}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={onResetFilters}
            title={t("events.page.resetTitle")}
          >
            <RiFilterOffLine data-icon="inline-start" aria-hidden />
            {t("common.actions.resetFilters")}
          </Button>
        </>
      }
    />
  );
}
