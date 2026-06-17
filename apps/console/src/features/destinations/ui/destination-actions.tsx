import { RiEditLine, RiEyeLine, RiPlayLine, RiShutDownLine } from "@remixicon/react";

import { IconTooltip } from "#/components/common/icon-tooltip.tsx";
import { powerActionButtonClassName } from "#/components/common/power-action-button.ts";
import { Button } from "#/components/ui/button.tsx";
import type { DestinationSummary } from "#/features/destinations/ui/destination-ui-types.ts";
import { useTranslations } from "#/i18n/use-i18n.ts";

export function DestinationActions({
  destination,
  pending,
  onTest,
  onPreview,
  onEdit,
  onToggle,
}: {
  destination: DestinationSummary;
  pending: boolean;
  onTest: (destination: DestinationSummary) => void;
  onPreview: (destination: DestinationSummary) => void;
  onEdit: (destinationId: string) => void;
  onToggle: (destination: DestinationSummary) => void;
}) {
  const t = useTranslations();
  const testLabel = t("destinations.table.actions.testTitle", { name: destination.name });
  const previewLabel = t("destinations.table.actions.previewTitle", {
    name: destination.name,
  });
  const editLabel = t("destinations.table.actions.edit");
  const toggleLabel = destination.enabled
    ? t("destinations.table.actions.disableTitle")
    : t("destinations.table.actions.enableTitle");

  return (
    <div className="flex justify-center gap-1">
      <IconTooltip label={testLabel}>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          disabled={pending}
          aria-label={testLabel}
          onClick={() => onTest(destination)}
        >
          <RiPlayLine data-icon="inline-start" aria-hidden />
        </Button>
      </IconTooltip>
      <IconTooltip label={previewLabel}>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          disabled={pending}
          aria-label={previewLabel}
          onClick={() => onPreview(destination)}
        >
          <RiEyeLine data-icon="inline-start" aria-hidden />
        </Button>
      </IconTooltip>
      <IconTooltip label={editLabel}>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          disabled={pending}
          aria-label={editLabel}
          onClick={() => onEdit(destination.id)}
        >
          <RiEditLine data-icon="inline-start" aria-hidden />
        </Button>
      </IconTooltip>
      <IconTooltip label={toggleLabel}>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          disabled={pending}
          aria-label={toggleLabel}
          className={powerActionButtonClassName(destination.enabled)}
          onClick={() => onToggle(destination)}
        >
          <RiShutDownLine data-icon="inline-start" aria-hidden />
        </Button>
      </IconTooltip>
    </div>
  );
}
