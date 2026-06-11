import type { ReactNode } from "react";

export interface DashboardSidebarProps {
  children: ReactNode;
}

export function DashboardSidebar({ children }: DashboardSidebarProps) {
  return <aside className="flex flex-col gap-4">{children}</aside>;
}
