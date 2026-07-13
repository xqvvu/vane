import { Eye, Restart } from "reicon-react";

import { IconTooltip } from "#/components/common/icon-tooltip.tsx";
import { Button } from "#/components/ui/button.tsx";
import type { Operations } from "#/features/operations/model/operation-types.ts";
import { useTranslations } from "#/i18n/use-i18n.ts";

export function DeliveryActions({
  delivery,
  pending,
  onInspect,
  onRetry,
}: {
  delivery: Operations["deliveries"]["items"][number];
  pending: boolean;
  onInspect: (deliveryId: string) => void;
  onRetry: (deliveryId: string) => void;
}) {
  const t = useTranslations();
  const retryLabel = t("deliveries.table.retry");
  const inspectLabel = t("deliveries.table.inspect");

  return (
    <div className="flex justify-center gap-1">
      {delivery.state === "failed" ? (
        <IconTooltip label={retryLabel}>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            disabled={pending}
            aria-label={retryLabel}
            onClick={() => onRetry(delivery.id)}
          >
            <Restart data-icon="inline-start" aria-hidden />
          </Button>
        </IconTooltip>
      ) : null}
      <IconTooltip label={inspectLabel}>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          disabled={pending}
          aria-label={inspectLabel}
          onClick={() => onInspect(delivery.id)}
        >
          <Eye data-icon="inline-start" aria-hidden />
        </Button>
      </IconTooltip>
    </div>
  );
}
