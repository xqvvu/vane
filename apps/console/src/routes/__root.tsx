import { TanStackDevtools } from "@tanstack/react-devtools";
import { useSuspenseQuery, type QueryClient } from "@tanstack/react-query";
import { HeadContent, Scripts, createRootRouteWithContext } from "@tanstack/react-router";

import { dashboardSessionQueryOptions } from "#/features/auth/api/auth.queries.ts";
import TanStackQueryDevtools from "#/integrations/tanstack/query/devtools";
import TanStackRouterDevtools from "#/integrations/tanstack/router/devtools";
import { DashboardErrorPage } from "#/shell/dashboard-error.tsx";
import { DashboardLayout } from "#/shell/dashboard-layout.tsx";
import { DashboardNotFoundPage } from "#/shell/dashboard-not-found.tsx";

import appCss from "#/styles.css?url";

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Vane Console",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: Root,
  errorComponent: DashboardErrorPage,
  notFoundComponent: RootNotFound,
});

function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}

        <TanStackDevtools
          config={{
            position: "bottom-right",
          }}
          plugins={[TanStackRouterDevtools, TanStackQueryDevtools]}
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
