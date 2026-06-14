import type * as React from "react";

import { Tooltip, TooltipContent, TooltipTrigger } from "#/components/ui/tooltip.tsx";

export function IconTooltip({
  label,
  children,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger render={<span className="inline-flex w-fit" />}>{children}</TooltipTrigger>
      <TooltipContent>
        <span>{label}</span>
      </TooltipContent>
    </Tooltip>
  );
}
