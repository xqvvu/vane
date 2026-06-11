import { RiPlayLine } from "@remixicon/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import * as React from "react";

import { DashboardContentLayout } from "#/app/shell/dashboard-layout.tsx";
import { DashboardSidebar } from "#/app/shell/dashboard-sidebar.tsx";
import { Button } from "#/components/ui/button.tsx";
import { configurationQueryOptions } from "#/features/configuration/api/configuration.queries.ts";
import { DeliveriesTable } from "#/features/deliveries/ui/deliveries-table.tsx";
import { useOperationMutations } from "#/features/operations/api/operation.mutations.ts";
import { operationsQueryOptions } from "#/features/operations/api/operations.queries.ts";
import type {
  DashboardOperationSearch,
  OperationFilterData,
} from "#/features/operations/model/operation-search.ts";
import type {
  DeliveryDetail,
  WorkerRunNotice,
} from "#/features/operations/model/operation-types.ts";
import { DetailPanel } from "#/features/operations/ui/detail-panel.tsx";
import { OperationFilters } from "#/features/operations/ui/operation-filters.tsx";
import { WorkerNoticePanel } from "#/features/operations/ui/worker-notice-panel.tsx";

export interface DeliveriesPageProps {
  search: DashboardOperationSearch;
  filters: OperationFilterData;
  onSearchChange: (next: Partial<DashboardOperationSearch>) => void;
}

export function DeliveriesPage({ search, filters, onSearchChange }: DeliveriesPageProps) {
  const { data: configuration } = useSuspenseQuery(configurationQueryOptions());
  const { data: operations } = useSuspenseQuery(operationsQueryOptions(filters));
  const { getDeliveryDetail, invalidateOperations, retryDelivery, runDeliveryWorker } =
    useOperationMutations();
  const [workerNotice, setWorkerNotice] = React.useState<WorkerRunNotice | null>(null);
  const [deliveryDetail, setDeliveryDetail] = React.useState<DeliveryDetail | null>(null);
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
          {workerNotice ? <WorkerNoticePanel notice={workerNotice} /> : null}
          <DeliveriesTable
            deliveries={operations.deliveries.items}
            nextCursor={operations.deliveries.nextCursor}
            pending={pending}
            onInspect={(deliveryId) =>
              void submitAction(`inspect-delivery-${deliveryId}`, async () => {
                const result = await getDeliveryDetail({
                  data: {
                    id: deliveryId,
                  },
                });
                setDeliveryDetail(result);
                return result;
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
          <DetailPanel eventDetail={null} deliveryDetail={deliveryDetail} />
        </>
      }
      sidebar={
        <DashboardSidebar>
          <Button
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() =>
              void submitAction("run-worker", async () => {
                const result = await runDeliveryWorker({
                  data: {
                    limit: 10,
                  },
                });
                setWorkerNotice(result);
                return result;
              })
            }
          >
            <RiPlayLine aria-hidden />
            Run worker
          </Button>
          <OperationFilters
            configuration={configuration}
            search={search}
            pending={pending}
            onChange={onSearchChange}
          />
        </DashboardSidebar>
      }
    />
  );
}
