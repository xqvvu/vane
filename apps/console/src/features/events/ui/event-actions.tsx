import { Eye } from "reicon-react";

import { IconTooltip } from "#/components/common/icon-tooltip.tsx";
import { Button } from "#/components/ui/button.tsx";
import { useTranslations } from "#/i18n/use-i18n.ts";

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
          <Eye data-icon="inline-start" aria-hidden />
        </Button>
      </IconTooltip>
    </div>
  );
}
