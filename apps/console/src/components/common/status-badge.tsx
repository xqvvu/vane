import type { ComponentProps } from "react";

import { Badge } from "#/components/ui/badge.tsx";
import { cn } from "#/lib/utils.ts";

export interface StatusBadgeProps extends Omit<ComponentProps<typeof Badge>, "variant"> {
  tone?: "neutral" | "success" | "danger" | "warning";
  pulse?: boolean;
}

export function StatusBadge({
  tone = "neutral",
  pulse = false,
  className,
  children,
  ...props
}: StatusBadgeProps) {
  return (
    <Badge
      variant={tone === "danger" ? "destructive" : "outline"}
      className={cn(
        "min-w-18 justify-center items-baseline gap-1.5 font-mono text-[11px]",
        tone === "success" ? "border-primary/25 bg-primary/10 text-primary" : null,
        tone === "warning" ? "border-ring/35 bg-accent/50 text-accent-foreground" : null,
        tone === "neutral" ? "border-border bg-muted/40 text-muted-foreground" : null,
        className,
      )}
      {...props}
    >
      <span
        aria-hidden
        className={cn(
          "size-1.5 shrink-0 rounded-full",
          tone === "success" ? "bg-primary" : null,
          tone === "danger" ? "bg-destructive" : null,
          tone === "warning" ? "bg-ring" : null,
          tone === "neutral" ? "bg-muted-foreground/45" : null,
          pulse && tone !== "neutral" ? "shadow-[0_0_8px_currentColor]" : null,
        )}
      />
      {children}
    </Badge>
  );
}
