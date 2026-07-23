import { useSuspenseQueries, useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { toast } from "sonner";

import { DeliveriesPageToolbar } from "#/features/deliveries/ui/deliveries-page-toolbar";
import { DeliveriesTable } from "#/features/deliveries/ui/deliveries-table";
import { destinationsQueryOptions } from "#/features/destinations/api/destination.queries";
import { useOperationMutations } from "#/features/operations/api/operation.mutations";
import { operationsQueryOptions } from "#/features/operations/api/operations.queries";
import type {
  DashboardOperationSearch,
  OperationFilterData,
} from "#/features/operations/model/operation-search";
import { OperationFilters } from "#/features/operations/ui/operation-filters";
import { showWorkerRunToast } from "#/features/operations/ui/worker-notice-panel";
import { sourcesQueryOptions } from "#/features/sources/api/source.queries";
import { useTranslations } from "#/i18n/use-i18n";
import { DashboardContentLayout } from "#/shell/dashboard-layout";
import { DashboardSidebar } from "#/shell/dashboard-sidebar";

export interface DeliveriesPageProps {
  search: DashboardOperationSearch;
  filters: OperationFilterData;
  onSearchChange: (next: Partial<DashboardOperationSearch>) => void;
}

export function DeliveriesPage({ search, filters, onSearchChange }: DeliveriesPageProps) {
  const t = useTranslations();
  const navigate = useNavigate();
  const [{ data: sources }, { data: destinations }] = useSuspenseQueries({
    queries: [sourcesQueryOptions(), destinationsQueryOptions()],
  });
  const { data: operations } = useSuspenseQuery(operationsQueryOptions(filters));
  const operationConfiguration = { sources, destinations };
  const { invalidateOperations, retryDelivery, runDeliveryWorker } = useOperationMutations();
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

    try {
      const result = await fn();
      await refreshOperations();
      return result;
    } catch (error) {
      toast.error(t("deliveries.page.operationFailed"), {
        description: error instanceof Error ? error.message : String(error),
      });
      return null;
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <DashboardContentLayout
      main={
        <>
          <DeliveriesPageToolbar
            pending={pending}
            onRunWorker={() =>
              void submitAction("run-worker", async () => {
                const result = await runDeliveryWorker({
                  data: {
                    limit: 10,
                  },
                });
                showWorkerRunToast(result, t);
                return result;
              })
            }
            onResetFilters={resetFilters}
          />
          <DeliveriesTable
            deliveries={operations.deliveries.items}
            nextCursor={operations.deliveries.nextCursor}
            pending={pending}
            onInspect={(deliveryId) =>
              void navigate({
                to: "/deliveries/$deliveryId",
                params: {
                  deliveryId,
                },
              })
            }
            onRetry={(deliveryId) =>
              void submitAction(`retry-delivery-${deliveryId}`, () =>
                retryDelivery({
                  data: {
                    id: deliveryId,
                  },
                }),
              )
            }
            onOlder={(cursor) => onSearchChange({ deliveryCursor: cursor })}
            onLatest={() => onSearchChange({ deliveryCursor: "" })}
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
        </DashboardSidebar>
      }
    />
  );
}
