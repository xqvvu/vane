import type { ReactNode } from "react";

import { Skeleton } from "#/components/ui/skeleton.tsx";
import { cn } from "#/lib/utils.ts";
import { DashboardHeader } from "#/shell/dashboard-header.tsx";
import { DashboardSidebar } from "#/shell/dashboard-sidebar.tsx";

export interface DashboardLayoutProps {
  user: {
    name: string | null;
    email: string;
    image: string | null;
    role: string | null;
  };
  children: ReactNode;
}

function DashboardLayoutRoot({ user, children }: DashboardLayoutProps) {
  return (
    <main className="bg-background text-foreground flex h-dvh flex-col overflow-hidden">
      <DashboardHeader user={user} />
      {children}
    </main>
  );
}

function DashboardLayoutSkeleton() {
  return (
    <main className="bg-background text-foreground flex h-dvh flex-col overflow-hidden">
      <header className="border-border bg-card sticky top-0 z-50 h-12 shrink-0 border-b">
        <div className="flex h-12 w-full items-center justify-between gap-4 px-3">
          <div className="flex h-full min-w-0 items-center gap-6">
            <Skeleton className="h-5 w-12 shrink-0" />
            <div className="hidden h-full min-w-0 items-center gap-5 sm:flex">
              <Skeleton className="h-4 w-14" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-14" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-18" />
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <Skeleton className="size-7" />
            <Skeleton className="size-7" />
            <Skeleton className="size-7 rounded-full" />
          </div>
        </div>
      </header>
      <DashboardContentLayout.Skeleton />
    </main>
  );
}

export const DashboardLayout = Object.assign(DashboardLayoutRoot, {
  Skeleton: DashboardLayoutSkeleton,
});

export interface DashboardContentLayoutProps {
  main: ReactNode;
  sidebar?: ReactNode;
}

function DashboardContentLayoutRoot({ main, sidebar }: DashboardContentLayoutProps) {
  return (
    <div
      className={cn(
        "mx-auto grid min-h-0 w-full max-w-7xl flex-1 gap-4 overflow-hidden px-5 py-5",
        sidebar ? "xl:grid-cols-[minmax(0,1fr)_360px]" : "grid-cols-1",
      )}
    >
      <section className="flex min-h-0 min-w-0 flex-col gap-4 overflow-y-auto">{main}</section>
      {sidebar}
    </div>
  );
}

function DashboardContentLayoutSkeleton() {
  return (
    <DashboardContentLayoutRoot
      main={
        <>
          <DashboardToolbarSkeleton />
          <div className="p-3">
            <div className="border-border bg-card border">
              <div className="border-border flex items-center justify-between border-b px-3 py-3">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="divide-border divide-y">
                {dashboardRowSkeletons.map((row) => (
                  <div
                    key={row}
                    className="grid grid-cols-[minmax(0,1fr)_76px] items-center gap-3 px-3 py-3 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_96px_120px]"
                  >
                    <div className="min-w-0">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="mt-2 h-3 w-1/2" />
                    </div>
                    <Skeleton className="hidden h-4 w-2/3 md:block" />
                    <Skeleton className="h-5 w-16 justify-self-end md:justify-self-auto" />
                    <Skeleton className="hidden h-4 w-24 md:block" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      }
      sidebar={
        <DashboardSidebar variant="split">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-56 max-w-full" />
            </div>
            {sidebarFieldSkeletons.map((field) => (
              <div key={field} className="flex flex-col gap-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-8 w-full" />
              </div>
            ))}
            <div className="border-border bg-background/60 mt-2 border p-4">
              <Skeleton className="h-3 w-28" />
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </div>
        </DashboardSidebar>
      }
    />
  );
}

function DashboardToolbarSkeleton() {
  return (
    <header className="border-border bg-background flex flex-col gap-3 border-b px-3 py-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-5 w-20" />
        </div>
        <Skeleton className="mt-3 h-4 w-[min(28rem,100%)]" />
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-7 w-28" />
      </div>
    </header>
  );
}

const dashboardRowSkeletons = ["row-1", "row-2", "row-3", "row-4", "row-5", "row-6"];
const sidebarFieldSkeletons = ["field-1", "field-2", "field-3", "field-4", "field-5"];

export const DashboardContentLayout = Object.assign(DashboardContentLayoutRoot, {
  Skeleton: DashboardContentLayoutSkeleton,
});
