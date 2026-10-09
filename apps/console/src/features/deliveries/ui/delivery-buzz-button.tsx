import { RiAlarmWarningLine } from "@remixicon/react";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "#/components/ui/button";
import type { DeliveryDetailData } from "#/features/deliveries/ui/delivery-detail-types";
import { useOperationMutations } from "#/features/operations/api/operation.mutations";
import { useTranslations } from "#/i18n/use-i18n";

/**
 * Manual urgent paging for this delivery.
 *
 * Only deliveries sent through a Feishu app carry the message reference a page
 * acts on; the disabled state explains that instead of failing on click.
 */
export function DeliveryBuzzButton({ detail }: { detail: DeliveryDetailData }) {
  const t = useTranslations();
  const { buzzDelivery, invalidateOperations } = useOperationMutations();
  const [pending, setPending] = React.useState(false);
  const pageable = detail.providerReference !== null;

  async function buzz(): Promise<void> {
    setPending(true);

    try {
      const result = await buzzDelivery({ id: detail.job.id });

      toast.success(t("deliveries.detail.buzz.successTitle", { count: result.pings.length }));
      await invalidateOperations();
    } catch (error) {
      toast.error(t("deliveries.detail.buzz.failureTitle"), {
        description: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending || !pageable}
        className="w-fit"
        onClick={() => void buzz()}
      >
        <RiAlarmWarningLine data-icon="inline-start" aria-hidden />
        {t("deliveries.detail.buzz.action")}
      </Button>
      {pageable ? null : (
        <span className="text-muted-foreground text-[11px]">
          {t("deliveries.detail.buzz.unavailable")}
        </span>
      )}
    </div>
  );
}
