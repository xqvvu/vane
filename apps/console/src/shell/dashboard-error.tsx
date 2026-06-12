import {
  RiCheckboxBlankLine,
  RiDatabase2Line,
  RiErrorWarningLine,
  RiFileSettingsLine,
  RiRefreshLine,
  RiRouteLine,
  RiShieldCheckLine,
  RiTerminalBoxLine,
} from "@remixicon/react";
import { Link, useLocation, useRouter, type ErrorComponentProps } from "@tanstack/react-router";
import { redactText } from "@vane/core";

import { Alert, AlertDescription, AlertTitle } from "#/components/ui/alert.tsx";
import { Badge } from "#/components/ui/badge.tsx";
import { Button, buttonVariants } from "#/components/ui/button.tsx";
import { Separator } from "#/components/ui/separator.tsx";

const recoveryLinks = [
  { label: "Events", to: "/events" },
  { label: "Sources", to: "/sources" },
  { label: "Routes", to: "/routes" },
  { label: "Settings", to: "/settings" },
] as const;

const checklistItems = [
  {
    icon: RiRefreshLine,
    title: "Retry request",
    description: "Reset the route boundary and re-run loaders for this view.",
  },
  {
    icon: RiShieldCheckLine,
    title: "Confirm dashboard session",
    description: "Sign in again if the current owner session expired.",
  },
  {
    icon: RiDatabase2Line,
    title: "Verify SQLite configuration",
    description: "Check the local database path, migrations, and file access.",
  },
  {
    icon: RiTerminalBoxLine,
    title: "Check server logs",
    description: "Inspect the console process for the full server-side error.",
  },
  {
    icon: RiFileSettingsLine,
    title: "Review recent TOML changes",
    description: "Look for invalid config imports or runtime setting changes.",
  },
] as const;

export function DashboardErrorPage({ error, reset }: ErrorComponentProps) {
  const router = useRouter();
  const currentPath = useLocation({
    select: (location) => location.href,
  });
  const redactedCurrentPath = redactText(currentPath);

  function tryAgain() {
    reset();
    void router.invalidate();
  }

  return (
    <div className="grid min-h-[calc(100vh-3rem)] w-full lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_30%]">
      <section className="border-border min-w-0 border-r">
        <div className="flex max-w-5xl flex-col gap-6 px-3 py-8 sm:px-8">
          <Alert variant="destructive" className="px-4 py-5">
            <RiErrorWarningLine aria-hidden />
            <AlertTitle className="flex flex-wrap items-center gap-3">
              <Badge variant="destructive" className="font-mono font-bold">
                ERROR
              </Badge>
              <h1 className="font-heading text-xl font-semibold">Application error</h1>
            </AlertTitle>
            <AlertDescription className="mt-3 text-sm">
              An unexpected runtime failure occurred while rendering this view.
            </AlertDescription>
          </Alert>

          <section className="border-border bg-muted/40 border p-4">
            <div className="text-muted-foreground text-[11px] font-bold tracking-[0.14em] uppercase">
              Redacted summary
            </div>
            <div className="border-border bg-background mt-3 border p-4">
              <div className="font-mono text-xs font-semibold">{safeErrorSummary(error)}</div>
              <code className="text-muted-foreground mt-2 block truncate font-mono text-xs">
                [REDACTED_TRACE_ID: generated_server_side]
              </code>
            </div>
          </section>

          <div className="flex flex-wrap items-center gap-2" aria-label="Error recovery actions">
            <Button type="button" size="sm" onClick={tryAgain}>
              <RiRefreshLine data-icon="inline-start" aria-hidden />
              Try again
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
            >
              Reload page
            </Button>
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
          </div>

          <section className="flex flex-wrap items-center gap-3 text-xs">
            <span className="text-muted-foreground">
              Vane Console / error boundary / runtime failure
            </span>
            <code className="border-border bg-muted max-w-full truncate border px-2 py-1 font-mono">
              {redactedCurrentPath}
            </code>
            <code className="border-border bg-muted border px-2 py-1 font-mono">
              timestamp unavailable
            </code>
          </section>
        </div>
      </section>

      <aside className="bg-muted/70 min-w-0 p-6">
        <div className="sticky top-16 flex flex-col gap-4">
          <div>
            <div className="flex items-center gap-2">
              <RiCheckboxBlankLine aria-hidden />
              <h2 className="font-heading text-base font-semibold">Operational checklist</h2>
            </div>
            <p className="text-muted-foreground mt-1 text-sm">
              Recommended recovery steps for operators.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            {checklistItems.map((item) => {
              const Icon = item.icon;

              return (
                <div key={item.title} className="border-border bg-background border p-3">
                  <div className="flex items-start gap-2">
                    <Icon className="text-muted-foreground mt-0.5" aria-hidden />
                    <div className="min-w-0">
                      <div className="font-medium">{item.title}</div>
                      <div className="text-muted-foreground mt-1 text-xs leading-5">
                        {item.description}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-border mt-auto border-t pt-4">
            <div className="text-muted-foreground flex items-center gap-2 text-xs italic">
              <RiRouteLine aria-hidden />
              Console rendering guard
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

function safeErrorSummary(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message ? redactText(error.message) : error.name || "Error";

    return `Internal rendering failure: ${message}`;
  }

  return "Internal rendering failure: Unknown error";
}
