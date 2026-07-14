import { RiFileCopyLine } from "@remixicon/react";
import { toast } from "sonner";

import { IconTooltip } from "#/components/common/icon-tooltip.tsx";
import { Button } from "#/components/ui/button.tsx";
import { Tooltip, TooltipContent, TooltipTrigger } from "#/components/ui/tooltip.tsx";
import { useTranslations } from "#/i18n/use-i18n.ts";
import { copyText } from "#/lib/browser.ts";
import { cn } from "#/lib/utils.ts";

export interface CopyableCodeLineProps {
  value: string;
  copyValue: string;
  copyLabel: string;
  wrap?: boolean;
  muted?: boolean;
  showToast?: boolean;
  toastDescription?: string;
  tooltipValue?: string;
}

export function CopyableCodeLine({
  value,
  copyValue,
  copyLabel,
  wrap = false,
  muted = false,
  showToast = false,
  toastDescription,
  tooltipValue,
}: CopyableCodeLineProps) {
  const t = useTranslations();
  const resolvedToastDescription = toastDescription ? toastDescription : t("common.actions.copied");
  const codeElement = (
    <code
      className={cn(
        "block min-w-0 font-mono text-[11px] leading-4",
        wrap ? "break-all" : "truncate",
        muted ? "text-muted-foreground" : null,
      )}
    >
      {value}
    </code>
  );

  return (
    <div className="flex min-w-0 items-center gap-1">
      {tooltipValue ? (
        <Tooltip>
          <TooltipTrigger
            render={
              <span className="block min-w-0 flex-1" tabIndex={0} aria-label={tooltipValue} />
            }
          >
            {codeElement}
          </TooltipTrigger>
          <TooltipContent className="max-w-96">
            <span className="font-mono break-all">{tooltipValue}</span>
          </TooltipContent>
        </Tooltip>
      ) : (
        <span className="block min-w-0 flex-1">{codeElement}</span>
      )}
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
                toast.success(resolvedToastDescription);
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
