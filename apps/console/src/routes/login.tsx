import { ClientOnly, createFileRoute, redirect } from "@tanstack/react-router";
import * as React from "react";
import { z } from "zod";

import {
  authBootstrapQueryOptions,
  dashboardSessionQueryOptions,
} from "#/features/auth/api/auth.queries";
import { LanguageSelector } from "#/i18n/language-switcher";
import { LoginForm } from "#/routes/-login-form";

const LoginSearchSchema = z.object({
  redirect: z.string().catch("/"),
});

export const Route = createFileRoute("/login")({
  validateSearch: LoginSearchSchema,
  beforeLoad: async ({ context, search }) => {
    const bootstrap = await context.queryClient.ensureQueryData(authBootstrapQueryOptions());

    if (bootstrap.setupRequired) {
      throw redirect({
        to: "/setup" as const,
        search: {
          redirect: search.redirect || "/",
        } as never,
      });
    }

    const session = await context.queryClient.ensureQueryData(dashboardSessionQueryOptions());

    if (session) {
      throw redirect({
        to: search.redirect || "/",
      });
    }
  },
  component: LoginPage,
});

function LoginPage() {
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
      <ClientOnly fallback={<LoginForm.Skeleton />}>
        <React.Suspense fallback={<LoginForm.Skeleton />}>
          <LoginForm redirectTo={search.redirect || "/"} />
        </React.Suspense>
      </ClientOnly>
    </main>
  );
}
