import { RiEditLine, RiFileCopyLine, RiKey2Line, RiShutDownLine } from "@remixicon/react";
import * as React from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "#/components/ui/alert-dialog.tsx";
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
  const [rotateDialogOpen, setRotateDialogOpen] = React.useState(false);

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
      <AlertDialog
        open={rotateDialogOpen}
        onOpenChange={(open) => {
          if (!pending) {
            setRotateDialogOpen(open);
          }
        }}
      >
        <AlertDialogTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              disabled={pending}
              title={t("sources.table.actions.rotateToken")}
            />
          }
        >
          <RiKey2Line data-icon="inline-start" aria-hidden />
        </AlertDialogTrigger>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("sources.rotate.confirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("sources.rotate.confirmDescription", { sourceName: source.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>{t("sources.rotate.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={pending}
              onClick={() => {
                setRotateDialogOpen(false);
                onRotateToken(source);
              }}
            >
              {t("sources.rotate.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
