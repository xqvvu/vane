import { RiCompass3Line, RiHomeLine } from "@remixicon/react";
import { Link, useLocation } from "@tanstack/react-router";
import { redactText } from "@vane/core";

import { Alert, AlertDescription, AlertTitle } from "#/components/ui/alert.tsx";
import { Badge } from "#/components/ui/badge.tsx";
import { buttonVariants } from "#/components/ui/button.tsx";
import { Separator } from "#/components/ui/separator.tsx";
import { cn } from "#/lib/utils.ts";

const recoveryLinks = [
  { label: "Events", to: "/events" },
  { label: "Routes", to: "/routes" },
  { label: "Settings", to: "/settings" },
] as const;

export function DashboardNotFoundPage() {
  const currentPath = useLocation({
    select: (location) => location.href,
  });
  const redactedCurrentPath = redactText(currentPath);

  return (
    <div className="flex min-h-[calc(100vh-3rem)] w-full items-center justify-center px-3 py-10 sm:px-8">
      <main className="flex w-full max-w-3xl flex-col gap-5">
        <Alert className="flex items-center px-4 py-5">
          <RiCompass3Line aria-hidden />
          <AlertTitle className="flex flex-wrap items-center gap-3">
            <Badge className="font-mono font-bold">404</Badge>
            <h1 className="font-heading text-xl font-semibold">Route not found</h1>
          </AlertTitle>
          <AlertDescription className="text-sm">
            The requested URL does not match a registered console route.
          </AlertDescription>
        </Alert>

        <section className="border-border bg-muted/40 border p-4">
          <div className="text-muted-foreground text-[11px] font-bold tracking-[0.14em] uppercase">
            Current request context
          </div>
          <code className="border-border bg-background text-primary mt-3 block w-fit max-w-full truncate border px-3 py-2 font-mono text-xs">
            {redactedCurrentPath}
          </code>
        </section>

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

        <section className="flex flex-wrap items-center gap-3 text-xs">
          <span className="text-muted-foreground">Vane Console / navigation guard / 404</span>
        </section>
      </main>
    </div>
  );
}
