import { RiFileCopyLine } from "@remixicon/react";

import { Button } from "#/components/ui/button.tsx";
import { cn } from "#/lib/utils.ts";

export interface CopyableCodeLineProps {
  value: string;
  copyValue: string;
  title: string;
  wrap?: boolean;
  muted?: boolean;
}

export function CopyableCodeLine({
  value,
  copyValue,
  title,
  wrap = false,
  muted = false,
}: CopyableCodeLineProps) {
  return (
    <div className="flex min-w-0 items-start gap-1">
      <code
        className={cn(
          "min-w-0 flex-1 font-mono text-[11px]",
          wrap ? "break-all" : "truncate",
          muted ? "text-muted-foreground" : null,
        )}
      >
        {value}
      </code>
      <Button
        type="button"
        variant="outline"
        size="icon-xs"
        title={title}
        onClick={() => void copyText(copyValue)}
      >
        <RiFileCopyLine data-icon="inline-start" aria-hidden />
      </Button>
    </div>
  );
}

async function copyText(value: string): Promise<void> {
  if (typeof navigator === "undefined" || !navigator.clipboard) {
    return;
  }

  await navigator.clipboard.writeText(value);
}
