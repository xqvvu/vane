import { RiShieldUserLine } from "@remixicon/react";
import { ClientOnly, createFileRoute, redirect } from "@tanstack/react-router";
import * as React from "react";
import { z } from "zod";

import { getDashboardSessionFn } from "#/application/functions/auth.functions.ts";

const LoginSearchSchema = z.object({
  redirect: z.string().catch("/"),
});

export const Route = createFileRoute("/login")({
  validateSearch: LoginSearchSchema,
  beforeLoad: async ({ search }) => {
    const session = await getDashboardSessionFn();

    if (session) {
      throw redirect({
        to: search.redirect || "/",
      });
    }
  },
  component: LoginPage,
});

const LoginForm = React.lazy(async () => {
  const module = await import("#/routes/-login-form.client.tsx");

  return { default: module.LoginForm };
});

function LoginPage() {
  const search = Route.useSearch();

  return (
    <main className="bg-background text-foreground flex min-h-screen items-center justify-center px-5 py-8">
      <section className="border-border bg-card w-full max-w-sm border">
        <div className="border-border border-b px-4 py-3">
          <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium">
            <RiShieldUserLine className="size-4" aria-hidden />
            Owner dashboard
          </div>
          <h1 className="mt-1 text-lg font-semibold">Vane Console</h1>
        </div>

        <div className="p-4">
          <ClientOnly>
            <React.Suspense fallback={null}>
              <LoginForm redirectTo={search.redirect || "/"} />
            </React.Suspense>
          </ClientOnly>
        </div>
      </section>
    </main>
  );
}
