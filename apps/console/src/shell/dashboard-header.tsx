import { RiNotification3Line, RiQuestionLine } from "@remixicon/react";
import { ClientOnly, Link } from "@tanstack/react-router";
import * as React from "react";

import { Button } from "#/components/ui/button.tsx";

const DashboardUserMenu = React.lazy(async () => {
  const module = await import("#/shell/dashboard-user-menu.tsx");

  return { default: module.DashboardUserMenu };
});

export interface DashboardHeaderProps {
  user: {
    email: string;
    role: string | null;
  };
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  return (
    <header className="border-border bg-card sticky top-0 z-50 h-12 border-b">
      <div className="flex h-12 w-full items-center justify-between gap-4 px-3">
        <div className="flex h-full min-w-0 items-center gap-6">
          <Link
            to="/events"
            className="font-heading text-primary shrink-0 text-base font-extrabold tracking-tight"
          >
            Vane
          </Link>
          <nav
            className="flex h-full min-w-0 items-center overflow-x-auto text-sm"
            aria-label="Dashboard"
          >
            <DashboardNavLink to="/events">Events</DashboardNavLink>
            <DashboardNavLink to="/deliveries">Deliveries</DashboardNavLink>
            <DashboardNavLink to="/sources">Sources</DashboardNavLink>
            <DashboardNavLink to="/routes">Routes</DashboardNavLink>
            <DashboardNavLink to="/destinations">Destinations</DashboardNavLink>
            <DashboardNavLink to="/settings">Settings</DashboardNavLink>
          </nav>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <Button type="button" variant="ghost" size="icon-sm" title="Notifications">
            <RiNotification3Line aria-hidden />
          </Button>
          <Button type="button" variant="ghost" size="icon-sm" title="Help">
            <RiQuestionLine aria-hidden />
          </Button>
          <ClientOnly>
            <React.Suspense fallback={null}>
              <DashboardUserMenu user={user} />
            </React.Suspense>
          </ClientOnly>
        </div>
      </div>
    </header>
  );
}

function DashboardNavLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      activeProps={{
        className: "border-primary text-primary font-semibold",
      }}
      inactiveProps={{
        className: "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
      }}
      className="flex h-full items-center border-b-2 px-3 font-medium whitespace-nowrap transition-colors"
    >
      {children}
    </Link>
  );
}
