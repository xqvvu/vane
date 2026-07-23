import { RiEyeLine } from "@remixicon/react";

import { IconTooltip } from "#/components/common/icon-tooltip";
import { Button } from "#/components/ui/button";
import { useTranslations } from "#/i18n/use-i18n";

export function EventActions({
  eventId,
  pending,
  onInspect,
}: {
  eventId: string;
  pending: boolean;
  onInspect: (eventId: string) => void;
}) {
  const t = useTranslations();
  const inspectLabel = t("events.table.inspect");

  return (
    <div className="flex justify-center">
      <IconTooltip label={inspectLabel}>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          disabled={pending}
          aria-label={inspectLabel}
          onClick={() => onInspect(eventId)}
        >
          <RiEyeLine data-icon="inline-start" aria-hidden />
        </Button>
      </IconTooltip>
    </div>
  );
}
