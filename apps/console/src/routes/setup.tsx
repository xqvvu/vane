import { ClientOnly, createFileRoute, redirect } from "@tanstack/react-router";
import * as React from "react";
import { z } from "zod";

import {
  authBootstrapQueryOptions,
  dashboardSessionQueryOptions,
} from "#/features/auth/api/auth.queries.ts";

const SetupSearchSchema = z.object({
  redirect: z.string().catch("/"),
});

export const Route = createFileRoute("/setup")({
  validateSearch: SetupSearchSchema,
  beforeLoad: async ({ context, search }) => {
    const session = await context.queryClient.ensureQueryData(dashboardSessionQueryOptions());

    if (session) {
      throw redirect({
        to: search.redirect || "/",
      });
    }

    const bootstrap = await context.queryClient.ensureQueryData(authBootstrapQueryOptions());

    if (!bootstrap.setupRequired) {
      throw redirect({
        to: "/login" as const,
        search: {
          redirect: search.redirect || "/",
        } as never,
      });
    }
  },
  component: SetupPage,
});

const SetupForm = React.lazy(async () => {
  const module = await import("#/routes/-setup-form.tsx");

  return { default: module.SetupForm };
});

function SetupPage() {
  const search = Route.useSearch();

  return (
    <main className="bg-background text-foreground flex min-h-screen items-center justify-center px-5 py-8">
      <ClientOnly>
        <React.Suspense fallback={null}>
          <SetupForm redirectTo={search.redirect || "/"} />
        </React.Suspense>
      </ClientOnly>
    </main>
  );
}
