import type { ReactNode } from "react";

import { Badge } from "#/components/ui/badge.tsx";
import { cn } from "#/lib/utils.ts";

export interface PageToolbarProps {
  description: ReactNode;
  actions?: ReactNode;
  badge?: ReactNode;
  tabs?: ReactNode;
  title?: ReactNode;
  className?: string;
}

export function PageToolbar({
  description,
  actions,
  badge,
  tabs,
  title,
  className,
}: PageToolbarProps) {
  return (
    <header
      className={cn(
        "border-border bg-background flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="flex min-w-0 flex-col gap-3">
        {title || badge ? (
          <div className="flex min-w-0 items-center gap-2">
            {title ? (
              <h1 className="font-heading truncate text-lg leading-none font-semibold">{title}</h1>
            ) : null}
            {badge ? (
              <Badge
                variant="outline"
                className="max-w-52 shrink-0 truncate text-[10px] font-bold tracking-wider uppercase"
              >
                {badge}
              </Badge>
            ) : null}
          </div>
        ) : null}

        <p className="text-muted-foreground text-sm">{description}</p>

        {tabs ? <div className="min-w-0">{tabs}</div> : null}
      </div>

      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}
