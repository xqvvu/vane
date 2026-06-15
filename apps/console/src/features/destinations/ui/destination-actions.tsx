import { RiEditLine, RiEyeLine, RiPlayLine, RiShutDownLine } from "@remixicon/react";

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

  return (
    <div className="flex min-w-0 justify-end gap-1">
      <Button
        variant="ghost"
        size="xs"
        disabled={pending}
        title={t("destinations.table.actions.testTitle", { name: destination.name })}
        onClick={() => onTest(destination)}
      >
        <RiPlayLine data-icon="inline-start" aria-hidden />
        {t("destinations.table.actions.test")}
      </Button>
      <Button
        variant="ghost"
        size="xs"
        disabled={pending}
        title={t("destinations.table.actions.previewTitle", {
          name: destination.name,
        })}
        onClick={() => onPreview(destination)}
      >
        <RiEyeLine data-icon="inline-start" aria-hidden />
        {t("destinations.table.actions.preview")}
      </Button>
      <Button
        variant="ghost"
        size="icon-xs"
        disabled={pending}
        title={t("destinations.table.actions.edit")}
        onClick={() => onEdit(destination.id)}
      >
        <RiEditLine data-icon aria-hidden />
      </Button>
      <Button
        variant="ghost"
        size="xs"
        disabled={pending}
        title={
          destination.enabled
            ? t("destinations.table.actions.disableTitle")
            : t("destinations.table.actions.enableTitle")
        }
        onClick={() => onToggle(destination)}
      >
        <RiShutDownLine data-icon="inline-start" aria-hidden />
        {destination.enabled
          ? t("destinations.table.actions.disable")
          : t("destinations.table.actions.enable")}
      </Button>
    </div>
  );
}
