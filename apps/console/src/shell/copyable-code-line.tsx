import { RiFileCopyLine } from "@remixicon/react";
import { toast } from "sonner";

import { Button } from "#/components/ui/button.tsx";
import { useTranslations } from "#/i18n/use-i18n";
import { copyText } from "#/lib/browser.ts";
import { cn } from "#/lib/utils.ts";
import { IconTooltip } from "#/shell/icon-tooltip.tsx";

export interface CopyableCodeLineProps {
  value: string;
  copyValue: string;
  copyLabel: string;
  wrap?: boolean;
  muted?: boolean;
  showToast?: boolean;
  toastDescription?: string;
}

export function CopyableCodeLine({
  value,
  copyValue,
  copyLabel,
  wrap = false,
  muted = false,
  showToast = false,
  toastDescription,
}: CopyableCodeLineProps) {
  const t = useTranslations();
  toastDescription = toastDescription ? toastDescription : t("common.actions.copied");

  return (
    <div className="flex min-w-0 items-center gap-1">
      <code
        className={cn(
          "min-w-0 flex-1 font-mono text-[11px] leading-4",
          wrap ? "break-all" : "truncate",
          muted ? "text-muted-foreground" : null,
        )}
      >
        {value}
      </code>
      <IconTooltip label={copyLabel}>
        <Button
          type="button"
          variant="outline"
          size="icon-xs"
          aria-label={copyLabel}
          onClick={async () => {
            try {
              await copyText(copyValue);
              if (showToast) {
                toast.success(toastDescription);
              }
            } catch {
              toast.error(t("common.actions.copyFailed"));
            }
          }}
        >
          <RiFileCopyLine data-icon="inline-start" aria-hidden />
        </Button>
      </IconTooltip>
    </div>
  );
}
