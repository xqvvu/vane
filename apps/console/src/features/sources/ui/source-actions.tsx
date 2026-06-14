import { RiEditLine, RiKey2Line, RiShutDownLine } from "@remixicon/react";
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
import type { SourceSummary } from "#/features/sources/ui/source-ui-types.ts";
import { useTranslations } from "#/i18n/use-i18n.ts";
import { cn } from "#/lib/utils.ts";
import { IconTooltip } from "#/shell/icon-tooltip.tsx";

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
  const editLabel = t("sources.table.actions.edit");
  const rotateTokenLabel = t("sources.table.actions.rotateToken");
  const toggleLabel = source.enabled
    ? t("sources.table.actions.disable")
    : t("sources.table.actions.enable");

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
          <RiEditLine data-icon="inline-start" aria-hidden />
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
            <RiKey2Line data-icon="inline-start" aria-hidden />
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
          className={sourcePowerButtonClassName(source.enabled)}
          onClick={() => onToggle(source)}
        >
          <RiShutDownLine data-icon="inline-start" aria-hidden />
        </Button>
      </IconTooltip>
    </div>
  );
}

function sourcePowerButtonClassName(enabled: boolean): string {
  return cn(
    "relative overflow-visible border-0 bg-transparent shadow-none hover:border-0 hover:bg-transparent focus-visible:border-0",
    enabled
      ? "text-destructive hover:text-destructive focus-visible:ring-destructive/35 [&_svg]:drop-shadow-[0_0_6px_rgb(248_113_113_/_0.95)] [&_svg]:transition-[filter,color] hover:[&_svg]:drop-shadow-[0_0_9px_rgb(248_113_113_/_1)]"
      : "text-muted-foreground hover:text-foreground focus-visible:ring-ring/35 [&_svg]:drop-shadow-none [&_svg]:transition-[filter,color]",
  );
}
