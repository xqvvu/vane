import { RiCheckboxBlankLine, RiCompass3Line, RiHomeLine, RiRouteLine } from "@remixicon/react";
import { Link, useLocation } from "@tanstack/react-router";

import { Badge } from "#/components/ui/badge.tsx";
import { buttonVariants } from "#/components/ui/button.tsx";
import { Separator } from "#/components/ui/separator.tsx";
import { cn } from "#/lib/utils.ts";

const recoveryLinks = [
  { label: "Events", to: "/events" },
  { label: "Routes", to: "/routes" },
  { label: "Settings", to: "/settings" },
] as const;

const checkItems = [
  {
    title: "Verify URL path",
    description: "Check for typos, stale bookmarks, or copied dashboard links.",
  },
  {
    title: "Use registered console routes",
    description: "Navigate through Sources, Routes, Events, Deliveries, or Settings.",
  },
  {
    title: "Review route configuration",
    description: "Confirm the missing URL is not being confused with an alert route rule.",
  },
] as const;

export function DashboardNotFoundPage() {
  const currentPath = useLocation({
    select: (location) => location.href,
  });

  return (
    <div className="grid min-h-[calc(100vh-3rem)] w-full lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_30%]">
      <section className="border-border min-w-0 border-r">
        <div className="border-border bg-background flex flex-col gap-4 border-b px-3 py-5">
          <div className="flex min-w-0 items-center gap-3">
            <Badge className="h-8 px-3 font-mono text-sm font-bold">404</Badge>
            <div className="min-w-0">
              <h1 className="font-heading text-2xl leading-none font-semibold">Route not found</h1>
              <p className="text-muted-foreground mt-2 text-sm">
                The requested URL does not match a registered console route.
              </p>
            </div>
          </div>
        </div>

        <div className="flex max-w-4xl flex-col gap-6 px-3 py-5">
          <section className="border-border bg-muted/40 border p-4">
            <div className="text-muted-foreground text-[11px] font-bold tracking-[0.14em] uppercase">
              Current request context
            </div>
            <code className="border-border bg-background text-primary mt-3 block w-fit max-w-full truncate border px-3 py-2 font-mono text-xs">
              {currentPath}
            </code>
          </section>

          <p className="text-foreground max-w-2xl text-sm leading-6">
            Verify the path or use the navigation actions below to return to an operational view.
          </p>

          <nav className="flex flex-wrap items-center gap-2" aria-label="404 recovery actions">
            <Link to="/sources" className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}>
              <RiHomeLine data-icon="inline-start" aria-hidden />
              Return to Sources
            </Link>
            <Separator orientation="vertical" className="mx-2 hidden h-7 sm:block" />
            {recoveryLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </section>

      <aside className="bg-muted/70 min-w-0 p-6">
        <div className="sticky top-16 flex flex-col gap-4">
          <div>
            <div className="flex items-center gap-2">
              <RiCompass3Line aria-hidden />
              <h2 className="font-heading text-base font-semibold">Navigation check</h2>
            </div>
            <p className="text-muted-foreground mt-1 text-sm">
              Recommended recovery steps for operators.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            {checkItems.map((item) => (
              <div key={item.title} className="border-border bg-background border p-3">
                <div className="flex items-start gap-2">
                  <RiCheckboxBlankLine className="text-muted-foreground mt-0.5" aria-hidden />
                  <div className="min-w-0">
                    <div className="font-medium">{item.title}</div>
                    <div className="text-muted-foreground mt-1 text-xs leading-5">
                      {item.description}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="border-border mt-auto border-t pt-4">
            <div className="text-muted-foreground flex items-center gap-2 text-xs italic">
              <RiRouteLine aria-hidden />
              Vane Console / navigation guard / 404
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
