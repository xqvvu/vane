import * as React from "react";

import { DialogContent } from "#/components/ui/dialog";
import { cn } from "#/lib/utils";

export function ConfigurationDialogContent({
  className,
  ...props
}: React.ComponentProps<typeof DialogContent>) {
  return (
    <DialogContent
      className={cn(
        "flex! max-h-[min(760px,calc(100dvh-2rem))] w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] flex-col overflow-hidden sm:w-[min(64rem,calc(100vw-2rem))] sm:max-w-none",
        className,
      )}
      {...props}
    />
  );
}
