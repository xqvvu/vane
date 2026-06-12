import { RiErrorWarningLine, RiRefreshLine } from "@remixicon/react";
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
    <div className="flex min-h-[calc(100vh-3rem)] w-full items-center justify-center px-3 py-10 sm:px-8">
      <main className="flex w-full max-w-3xl flex-col gap-5">
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
            <div className="font-mono text-xs font-semibold wrap-break-word">
              {safeErrorSummary(error)}
            </div>
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
        </section>
      </main>
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
