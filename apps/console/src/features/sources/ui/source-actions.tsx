import { RiEditLine, RiFileCopyLine, RiKey2Line, RiShutDownLine } from "@remixicon/react";

import { Button } from "#/components/ui/button.tsx";
import { sourceWebhookUrl } from "#/features/sources/model/source-webhook.ts";
import type { SourceSummary } from "#/features/sources/ui/source-ui-types.ts";
import { useTranslations } from "#/i18n/use-i18n.ts";
import { copyText } from "#/lib/browser.ts";

export function SourceActions({
  source,
  pending,
  onEdit,
  onToggle,
  onRotateToken,
}: {
  source: SourceSummary;
  pending: boolean;
  onEdit: (sourceId: string) => void;
  onToggle: (source: SourceSummary) => void;
  onRotateToken: (source: SourceSummary) => void;
}) {
  const t = useTranslations();

  return (
    <div className="flex justify-end gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        disabled={pending}
        title={t("sources.table.actions.copyWebhookUrl")}
        onClick={() => void copyText(sourceWebhookUrl(source.id))}
      >
        <RiFileCopyLine data-icon="inline-start" aria-hidden />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        disabled={pending}
        title={t("sources.table.actions.edit")}
        onClick={() => onEdit(source.id)}
      >
        <RiEditLine data-icon="inline-start" aria-hidden />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        disabled={pending}
        title={t("sources.table.actions.rotateToken")}
        onClick={() => onRotateToken(source)}
      >
        <RiKey2Line data-icon="inline-start" aria-hidden />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        disabled={pending}
        title={
          source.enabled ? t("sources.table.actions.disable") : t("sources.table.actions.enable")
        }
        onClick={() => onToggle(source)}
      >
        <RiShutDownLine data-icon="inline-start" aria-hidden />
      </Button>
    </div>
  );
}
