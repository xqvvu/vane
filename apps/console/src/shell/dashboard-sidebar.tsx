import type { ReactNode } from "react";

import { cn } from "#/lib/utils.ts";

export interface DashboardSidebarProps {
  children: ReactNode;
  className?: string;
  variant?: "contained" | "split";
}

export function DashboardSidebar({
  children,
  className,
  variant = "contained",
}: DashboardSidebarProps) {
  if (variant === "split") {
    return (
      <aside className={cn("bg-muted/70 min-w-0 p-6 lg:min-w-80", className)}>
        <div className="sticky top-16 flex flex-col gap-6">{children}</div>
      </aside>
    );
  }

  return <aside className={cn("flex flex-col gap-4", className)}>{children}</aside>;
}
