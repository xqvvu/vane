import type { ReactNode } from "react";

import { DashboardHeader } from "#/app/shell/dashboard-header.tsx";

export interface DashboardLayoutProps {
  user: {
    email: string;
    role: string | null;
  };
  onRefresh: () => void;
  children: ReactNode;
}

export function DashboardLayout({ user, onRefresh, children }: DashboardLayoutProps) {
  return (
    <main className="bg-background text-foreground min-h-screen">
      <DashboardHeader user={user} onRefresh={onRefresh} />
      {children}
    </main>
  );
}

export interface DashboardContentLayoutProps {
  main: ReactNode;
  sidebar?: ReactNode;
}

export function DashboardContentLayout({ main, sidebar }: DashboardContentLayoutProps) {
  return (
    <div className="mx-auto grid w-full max-w-7xl gap-4 px-5 py-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="flex flex-col gap-4">{main}</section>
      {sidebar}
    </div>
  );
}
