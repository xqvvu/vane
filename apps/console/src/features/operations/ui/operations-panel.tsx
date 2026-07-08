import { RiPlayLine, RiTimeLine } from "@remixicon/react";

import { ContentPanel } from "#/components/common/content-panel.tsx";
import { Button } from "#/components/ui/button.tsx";
import type { Configuration } from "#/features/configuration/model/configuration-types.ts";
import { DeliveriesTable } from "#/features/deliveries/ui/deliveries-table.tsx";
import { EventsTable } from "#/features/events/ui/events-table.tsx";
import type { DashboardOperationSearch } from "#/features/operations/model/operation-search.ts";
import type {
  DeliveryDetail,
  EventDetail,
  Operations,
} from "#/features/operations/model/operation-types.ts";
import { DetailPanel } from "#/features/operations/ui/detail-panel.tsx";
import { OperationFilters } from "#/features/operations/ui/operation-filters.tsx";
import { useTranslations } from "#/i18n/use-i18n.ts";

export interface OperationsPanelProps {
  configuration: Configuration;
  operations: Operations;
  search: DashboardOperationSearch;
  eventDetail: EventDetail | null;
  deliveryDetail: DeliveryDetail | null;
  pending: boolean;
  onRunWorker: () => void;
  onFilterChange: (next: Partial<DashboardOperationSearch>) => void;
  onInspectEvent: (eventId: string) => void;
  onInspectDelivery: (deliveryId: string) => void;
  onRetryDelivery: (deliveryId: string) => void;
  onEventPageChange: (page: number) => void;
  onOlderDeliveries: (cursor: string) => void;
  onLatestDeliveries: () => void;
}

export function OperationsPanel({
  configuration,
  operations,
  search,
  eventDetail,
  deliveryDetail,
  pending,
  onRunWorker,
  onFilterChange,
  onInspectEvent,
  onInspectDelivery,
  onRetryDelivery,
  onEventPageChange,
  onOlderDeliveries,
  onLatestDeliveries,
}: OperationsPanelProps) {
  const t = useTranslations();

  return (
    <ContentPanel
      title={t("operations.title")}
      icon={<RiTimeLine className="size-4" aria-hidden />}
      action={
        <Button variant="outline" size="sm" disabled={pending} onClick={onRunWorker}>
          <RiPlayLine aria-hidden />
          {t("common.actions.runWorker")}
        </Button>
      }
    >
      <OperationFilters
        configuration={configuration}
        search={search}
        pending={pending}
        onChange={onFilterChange}
      />
      <div className="mt-3 grid gap-4 xl:grid-cols-2">
        <EventsTable
          events={operations.events.items}
          page={operations.events.page}
          pageSize={operations.events.pageSize}
          total={operations.events.total}
          pending={pending}
          onInspect={onInspectEvent}
          onPageChange={onEventPageChange}
        />
        <DeliveriesTable
          deliveries={operations.deliveries.items}
          nextCursor={operations.deliveries.nextCursor}
          pending={pending}
          onInspect={onInspectDelivery}
          onRetry={onRetryDelivery}
          onOlder={onOlderDeliveries}
          onLatest={onLatestDeliveries}
        />
      </div>
      <DetailPanel eventDetail={eventDetail} deliveryDetail={deliveryDetail} />
    </ContentPanel>
  );
}
