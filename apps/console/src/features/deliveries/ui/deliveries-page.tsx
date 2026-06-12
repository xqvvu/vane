import { RiErrorWarningLine, RiFilterOffLine, RiPlayLine } from "@remixicon/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import * as React from "react";

import { Alert, AlertDescription, AlertTitle } from "#/components/ui/alert.tsx";
import { Badge } from "#/components/ui/badge.tsx";
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
import { DashboardContentLayout } from "#/shell/dashboard-layout.tsx";
import { DashboardSidebar } from "#/shell/dashboard-sidebar.tsx";

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
          <DeliveriesPageToolbar
            deliveryCount={operations.deliveries.items.length}
            pending={pending}
            onRunWorker={() =>
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
            onResetFilters={resetFilters}
          />
          {formError ? (
            <Alert variant="destructive" className="mx-3 mt-4">
              <RiErrorWarningLine aria-hidden />
              <AlertTitle>Operation failed</AlertTitle>
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
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
  deliveryCount,
  pending,
  onRunWorker,
  onResetFilters,
}: {
  deliveryCount: number;
  pending: boolean;
  onRunWorker: () => void;
  onResetFilters: () => void;
}) {
  return (
    <header className="border-border bg-background flex flex-col gap-3 border-b px-3 py-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h1 className="font-heading text-2xl leading-none font-semibold">Deliveries</h1>
          <Badge variant="outline" className="text-[10px] font-bold tracking-wider uppercase">
            {deliveryCount} loaded
          </Badge>
        </div>
        <p className="text-muted-foreground mt-2 text-sm">
          Inspect outbound notification jobs, rendered payloads, attempts, and retry schedules.
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={onResetFilters}
          title="Reset delivery filters"
        >
          <RiFilterOffLine data-icon="inline-start" aria-hidden />
          Reset filters
        </Button>
        <Button
          type="button"
          variant="default"
          size="sm"
          disabled={pending}
          onClick={onRunWorker}
          title="Run delivery worker"
        >
          <RiPlayLine data-icon="inline-start" aria-hidden />
          Run worker
        </Button>
      </div>
    </header>
  );
}
