import { TanStackDevtools } from "@tanstack/react-devtools";
import { useSuspenseQuery, type QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import { HeadContent, Scripts, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";

import { Toaster } from "#/components/ui/sonner.tsx";
import { TooltipProvider } from "#/components/ui/tooltip.tsx";
import { dashboardSessionQueryOptions } from "#/features/auth/api/auth.queries.ts";
import { requestLocaleQueryOptions } from "#/i18n/i18n.queries.ts";
import { VaneIntlProvider } from "#/i18n/provider.tsx";
import { DashboardErrorPage } from "#/shell/dashboard-error.tsx";
import { DashboardLayout } from "#/shell/dashboard-layout.tsx";
import { DashboardNotFoundPage } from "#/shell/dashboard-not-found.tsx";

import appCss from "#/styles.css?url";

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  loader: ({ context }) => context.queryClient.ensureQueryData(requestLocaleQueryOptions()),
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Vane" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "manifest", href: "/manifest.json" },
    ],
  }),
  shellComponent: Root,
  errorComponent: DashboardErrorPage,
  notFoundComponent: RootNotFound,
});

function Root({ children }: { children: React.ReactNode }) {
  const { data } = useSuspenseQuery(requestLocaleQueryOptions());

  return (
    <html lang={data.locale}>
      <head>
        <HeadContent />
      </head>

      <body className="h-dvh">
        <VaneIntlProvider locale={data.locale} timeZone={data.timeZone}>
          <TooltipProvider>{children}</TooltipProvider>
        </VaneIntlProvider>

        <Toaster position="top-right" />

        <TanStackDevtools
          config={{
            position: "bottom-right",
          }}
          plugins={[
            { name: "Tanstack Query", render: <ReactQueryDevtoolsPanel /> },
            { name: "Tanstack Router", render: <TanStackRouterDevtoolsPanel /> },
          ]}
        />

        <Scripts />
      </body>
    </html>
  );
}

function RootNotFound() {
  const { data: session } = useSuspenseQuery(dashboardSessionQueryOptions());

  if (!session) {
    return <DashboardNotFoundPage />;
  }

  return (
    <DashboardLayout user={session.user}>
      <DashboardNotFoundPage />
    </DashboardLayout>
  );
}
