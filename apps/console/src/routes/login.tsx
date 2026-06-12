import { ClientOnly, createFileRoute, redirect } from "@tanstack/react-router";
import * as React from "react";
import { z } from "zod";

import {
  authBootstrapQueryOptions,
  dashboardSessionQueryOptions,
} from "#/features/auth/api/auth.queries.ts";

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

const LoginForm = React.lazy(async () => {
  const module = await import("#/routes/-login-form.tsx");

  return { default: module.LoginForm };
});

function LoginPage() {
  const search = Route.useSearch();

  return (
    <main className="bg-background text-foreground flex min-h-screen items-center justify-center px-5 py-8">
      <ClientOnly>
        <React.Suspense fallback={null}>
          <LoginForm redirectTo={search.redirect || "/"} />
        </React.Suspense>
      </ClientOnly>
    </main>
  );
}
