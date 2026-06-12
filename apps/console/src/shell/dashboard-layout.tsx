import type { ReactNode } from "react";

import { DashboardHeader } from "#/shell/dashboard-header.tsx";

export interface DashboardLayoutProps {
  user: {
    name: string | null;
    email: string;
    image: string | null;
    role: string | null;
  };
  children: ReactNode;
}

export function DashboardLayout({ user, children }: DashboardLayoutProps) {
  return (
    <main className="bg-background text-foreground min-h-screen">
      <DashboardHeader user={user} />
      {children}
    </main>
  );
}

export interface DashboardContentLayoutProps {
  main: ReactNode;
  sidebar?: ReactNode;
  variant?: "contained" | "split";
}

export function DashboardContentLayout({
  main,
  sidebar,
  variant = "contained",
}: DashboardContentLayoutProps) {
  if (variant === "split") {
    return (
      <div className="grid min-h-[calc(100vh-3rem)] w-full lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_30%]">
        <section className="border-border min-w-0 border-r">{main}</section>
        {sidebar}
      </div>
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-4 px-5 py-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="flex flex-col gap-4">{main}</section>
      {sidebar}
    </div>
  );
}
