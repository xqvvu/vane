import type { ReactNode } from "react";

import { cn } from "#/lib/utils.ts";

export function EventDetailTerm({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
}) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "min-w-0 wrap-break-word font-medium",
          mono ? "font-mono text-[11px] leading-5" : null,
        )}
      >
        {value}
      </dd>
    </>
  );
}
