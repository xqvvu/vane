import * as React from "react";
import { Trash, Edit2, Key2, Power } from "reicon-react";

import { IconTooltip } from "#/components/common/icon-tooltip.tsx";
import { powerActionButtonClassName } from "#/components/common/power-action-button.ts";
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
import type { SourceSummary } from "#/features/sources/ui/source-ui-types.ts";
import { useTranslations } from "#/i18n/use-i18n.ts";

export function SourceActions({
  source,
  pending,
  onEdit,
  onToggle,
  onRotateToken,
  onDelete,
}: {
  source: SourceSummary;
  pending: boolean;
  onEdit: (sourceId: string) => void;
  onToggle: (source: SourceSummary) => void;
  onRotateToken: (source: SourceSummary) => void;
  onDelete: (source: SourceSummary) => void;
}) {
  const t = useTranslations();
  const [rotateDialogOpen, setRotateDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const editLabel = t("sources.table.actions.edit");
  const rotateTokenLabel = t("sources.table.actions.rotateToken");
  const toggleLabel = source.enabled
    ? t("sources.table.actions.disable")
    : t("sources.table.actions.enable");
  const deleteLabel = t("sources.table.actions.delete");

  return (
    <div className="flex justify-center gap-1">
      <IconTooltip label={editLabel}>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          disabled={pending}
          aria-label={editLabel}
          onClick={() => onEdit(source.id)}
        >
          <Edit2 data-icon="inline-start" aria-hidden />
        </Button>
      </IconTooltip>
      <AlertDialog
        open={rotateDialogOpen}
        onOpenChange={(open) => {
          if (!pending) {
            setRotateDialogOpen(open);
          }
        }}
      >
        <IconTooltip label={rotateTokenLabel}>
          <AlertDialogTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                disabled={pending}
                aria-label={rotateTokenLabel}
              />
            }
          >
            <Key2 data-icon="inline-start" aria-hidden />
          </AlertDialogTrigger>
        </IconTooltip>
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
      <IconTooltip label={toggleLabel}>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          disabled={pending}
          aria-label={toggleLabel}
          className={powerActionButtonClassName(source.enabled)}
          onClick={() => onToggle(source)}
        >
          <Power data-icon="inline-start" aria-hidden />
        </Button>
      </IconTooltip>
      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!pending) {
            setDeleteDialogOpen(open);
          }
        }}
      >
        <IconTooltip label={deleteLabel}>
          <AlertDialogTrigger
            render={
              <Button
                type="button"
                variant="destructive"
                size="icon-xs"
                disabled={pending}
                aria-label={deleteLabel}
              />
            }
          >
            <Trash data-icon="inline-start" aria-hidden />
          </AlertDialogTrigger>
        </IconTooltip>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("sources.delete.confirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("sources.delete.confirmDescription", { sourceName: source.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>{t("sources.delete.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={pending}
              onClick={() => {
                setDeleteDialogOpen(false);
                onDelete(source);
              }}
            >
              {t("sources.delete.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
