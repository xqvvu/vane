import { ClientOnly, createFileRoute, redirect } from "@tanstack/react-router";
import * as React from "react";
import { z } from "zod";

import {
  authBootstrapQueryOptions,
  dashboardSessionQueryOptions,
} from "#/features/auth/api/auth.queries.ts";
import { LanguageSelector } from "#/i18n/language-switcher.tsx";
import { SetupForm } from "#/routes/-setup-form.tsx";

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

function SetupPage() {
  const search = Route.useSearch();

  return (
    <main className="bg-background text-foreground flex min-h-screen items-center justify-center px-5 py-8">
      <div className="absolute top-4 right-4">
        <ClientOnly fallback={<LanguageSelector.Skeleton />}>
          <React.Suspense fallback={<LanguageSelector.Skeleton />}>
            <LanguageSelector />
          </React.Suspense>
        </ClientOnly>
      </div>
      <ClientOnly fallback={<SetupForm.Skeleton />}>
        <React.Suspense fallback={<SetupForm.Skeleton />}>
          <SetupForm redirectTo={search.redirect || "/"} />
        </React.Suspense>
      </ClientOnly>
    </main>
  );
}
