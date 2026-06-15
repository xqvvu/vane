import { RiArrowRightLine, RiEyeLine, RiRefreshLine, RiRestartLine } from "@remixicon/react";

import { SimpleTable } from "#/components/common/simple-table.tsx";
import { Button } from "#/components/ui/button.tsx";
import { DeliveryStateBadge } from "#/features/deliveries/ui/delivery-state-badge.tsx";
import { formatDateTime, formatTime } from "#/features/operations/model/operation-format.ts";
import type { Operations } from "#/features/operations/model/operation-types.ts";
import { useTranslations } from "#/i18n/use-i18n.ts";

export function DeliveriesTable({
  deliveries,
  nextCursor,
  pending,
  onInspect,
  onRetry,
  onOlder,
  onLatest,
}: {
  deliveries: Operations["deliveries"]["items"];
  nextCursor: string | null;
  pending: boolean;
  onInspect: (deliveryId: string) => void;
  onRetry: (deliveryId: string) => void;
  onOlder: (cursor: string) => void;
  onLatest: () => void;
}) {
  const t = useTranslations();

  return (
    <section className="bg-background">
      <div className="border-border flex items-center justify-between gap-3 border-b px-3 py-2">
        <h3 className="text-xs font-semibold">{t("deliveries.table.title")}</h3>
        <span className="text-muted-foreground text-xs">{t("deliveries.table.order")}</span>
      </div>
      <SimpleTable
        variant="flush"
        empty={t("deliveries.table.empty")}
        headers={[
          t("deliveries.table.headers.target"),
          t("deliveries.table.headers.event"),
          t("deliveries.table.headers.state"),
          t("deliveries.table.headers.attempts"),
          t("deliveries.table.headers.next"),
          t("deliveries.table.headers.lastError"),
          t("deliveries.table.headers.updated"),
          t("deliveries.table.headers.actions"),
        ]}
        columnClassNames={[
          "w-[18%]",
          "w-[20%]",
          "w-[10%]",
          "w-[9%]",
          "w-[10%]",
          "w-[19%]",
          "w-[10%]",
          "w-[4%]",
        ]}
        rows={deliveries.map((delivery) => ({
          key: delivery.id,
          cells: [
            <DeliveryTargetCell
              key="target"
              destinationName={delivery.destinationName}
              routeName={delivery.routeName}
            />,
            <DeliveryEventCell
              key="event"
              eventId={delivery.eventId}
              sourceName={delivery.sourceName}
            />,
            <DeliveryStateBadge key="state" state={delivery.state} />,
            <span key="attempts" className="font-medium">
              {delivery.attemptCount}
            </span>,
            delivery.nextAttemptAt ? formatTime(delivery.nextAttemptAt) : "—",
            <span key="error" className="truncate" title={delivery.lastError ?? undefined}>
              {delivery.lastError ?? "—"}
            </span>,
            <span key="updated" title={formatDateTime(delivery.updatedAt)}>
              {formatTime(delivery.updatedAt)}
            </span>,
            <div key="actions" className="flex justify-end gap-1">
              {delivery.state === "failed" ? (
                <Button
                  variant="outline"
                  size="icon-xs"
                  disabled={pending}
                  title={t("deliveries.table.retry")}
                  onClick={() => onRetry(delivery.id)}
                >
                  <RiRestartLine aria-hidden />
                </Button>
              ) : null}
              <Button
                variant="outline"
                size="icon-xs"
                disabled={pending}
                title={t("deliveries.table.inspect")}
                onClick={() => onInspect(delivery.id)}
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

function DeliveryTargetCell({
  destinationName,
  routeName,
}: {
  destinationName: string;
  routeName: string | null;
}) {
  const t = useTranslations();

  return (
    <div className="min-w-0">
      <div className="truncate font-medium" title={destinationName}>
        {destinationName}
      </div>
      <div
        className="text-muted-foreground truncate text-[11px]"
        title={routeName ?? t("deliveries.table.manual")}
      >
        {routeName ?? t("deliveries.table.manual")}
      </div>
    </div>
  );
}

function DeliveryEventCell({ eventId, sourceName }: { eventId: string; sourceName: string }) {
  return (
    <div className="min-w-0">
      <div className="truncate font-medium" title={sourceName}>
        {sourceName}
      </div>
      <div className="text-muted-foreground truncate font-mono text-[11px]" title={eventId}>
        {eventId}
      </div>
    </div>
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
  const t = useTranslations();

  return (
    <div className="border-border flex items-center justify-end gap-1 border-t px-3 py-3">
      <Button
        type="button"
        variant="outline"
        size="xs"
        disabled={pending}
        onClick={onLatest}
        title={t("operations.history.showLatest")}
      >
        <RiRefreshLine data-icon="inline-start" aria-hidden />
        {t("operations.history.latest")}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="xs"
        disabled={pending || !hasPrevious || !onOlder}
        onClick={onOlder}
        title={t("operations.history.showOlder")}
      >
        {t("operations.history.older")}
        <RiArrowRightLine data-icon="inline-end" aria-hidden />
      </Button>
    </div>
  );
}
