import type { ReactNode } from "react";

import { cn } from "#/lib/utils";

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
      <aside
        className={cn("bg-muted/70 min-h-0 min-w-0 overflow-y-auto p-6 lg:min-w-80", className)}
      >
        <div className="flex flex-col gap-6">{children}</div>
      </aside>
    );
  }

  return <aside className={cn("flex flex-col gap-4", className)}>{children}</aside>;
}
