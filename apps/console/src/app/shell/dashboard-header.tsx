import { RiDatabase2Line, RiRefreshLine } from "@remixicon/react";
import { ClientOnly, Link } from "@tanstack/react-router";
import * as React from "react";

import { Button } from "#/components/ui/button.tsx";

const DashboardUserMenu = React.lazy(async () => {
  const module = await import("#/app/shell/dashboard-user-menu.client.tsx");

  return { default: module.DashboardUserMenu };
});

export interface DashboardHeaderProps {
  user: {
    email: string;
    role: string | null;
  };
  onRefresh: () => void;
}

export function DashboardHeader({ user, onRefresh }: DashboardHeaderProps) {
  return (
    <header className="border-border bg-card border-b">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-5 py-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium">
              <RiDatabase2Line className="size-4" aria-hidden />
              SQLite-first alert hub
            </div>
            <h1 className="mt-1 text-xl font-semibold">Vane Console</h1>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RiRefreshLine aria-hidden />
              Refresh
            </Button>
            <ClientOnly>
              <React.Suspense fallback={null}>
                <DashboardUserMenu user={user} />
              </React.Suspense>
            </ClientOnly>
          </div>
        </div>
        <nav className="flex flex-wrap gap-1 text-xs" aria-label="Dashboard">
          <DashboardNavLink to="/events">Events</DashboardNavLink>
          <DashboardNavLink to="/deliveries">Deliveries</DashboardNavLink>
          <DashboardNavLink to="/sources">Sources</DashboardNavLink>
          <DashboardNavLink to="/routes">Routes</DashboardNavLink>
          <DashboardNavLink to="/destinations">Destinations</DashboardNavLink>
          <DashboardNavLink to="/settings">Settings</DashboardNavLink>
        </nav>
      </div>
    </header>
  );
}

function DashboardNavLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      activeProps={{
        className: "border-primary text-foreground bg-background",
      }}
      inactiveProps={{
        className: "border-transparent text-muted-foreground hover:text-foreground",
      }}
      className="border px-2 py-1 font-medium"
    >
      {children}
    </Link>
  );
}
