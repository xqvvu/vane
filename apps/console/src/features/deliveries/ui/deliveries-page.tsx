import { RiFilterOffLine, RiPlayLine } from "@remixicon/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { toast } from "sonner";

import { PageToolbar } from "#/components/common/page-toolbar.tsx";
import { Button } from "#/components/ui/button.tsx";
import { configurationQueryOptions } from "#/features/configuration/api/configuration.queries.ts";
import { DeliveriesTable } from "#/features/deliveries/ui/deliveries-table.tsx";
import { useOperationMutations } from "#/features/operations/api/operation.mutations.ts";
import { operationsQueryOptions } from "#/features/operations/api/operations.queries.ts";
import type {
  DashboardOperationSearch,
  OperationFilterData,
} from "#/features/operations/model/operation-search.ts";
import { OperationFilters } from "#/features/operations/ui/operation-filters.tsx";
import { showWorkerRunToast } from "#/features/operations/ui/worker-notice-panel.tsx";
import { useTranslations } from "#/i18n/use-i18n.ts";
import { DashboardContentLayout } from "#/shell/dashboard-layout.tsx";
import { DashboardSidebar } from "#/shell/dashboard-sidebar.tsx";

export interface DeliveriesPageProps {
  search: DashboardOperationSearch;
  filters: OperationFilterData;
  onSearchChange: (next: Partial<DashboardOperationSearch>) => void;
}

export function DeliveriesPage({ search, filters, onSearchChange }: DeliveriesPageProps) {
  const t = useTranslations();
  const navigate = useNavigate();
  const { data: configuration } = useSuspenseQuery(configurationQueryOptions());
  const { data: operations } = useSuspenseQuery(operationsQueryOptions(filters));
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
            configuration={configuration}
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

function DeliveriesPageToolbar({
  pending,
  onRunWorker,
  onResetFilters,
}: {
  pending: boolean;
  onRunWorker: () => void;
  onResetFilters: () => void;
}) {
  const t = useTranslations();

  return (
    <PageToolbar
      description={t("deliveries.page.description")}
      actions={
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={onResetFilters}
            title={t("deliveries.page.resetTitle")}
          >
            <RiFilterOffLine data-icon="inline-start" aria-hidden />
            {t("common.actions.resetFilters")}
          </Button>
          <Button
            type="button"
            variant="default"
            size="sm"
            disabled={pending}
            onClick={onRunWorker}
            title={t("deliveries.page.runWorkerTitle")}
          >
            <RiPlayLine data-icon="inline-start" aria-hidden />
            {t("common.actions.runWorker")}
          </Button>
        </>
      }
    />
  );
}
