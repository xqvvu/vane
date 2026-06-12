import { createFileRoute } from "@tanstack/react-router";

import { configurationQueryOptions } from "#/features/configuration/api/configuration.queries.ts";
import { DeliveriesPage } from "#/features/deliveries/ui/deliveries-page.tsx";
import { operationsQueryOptions } from "#/features/operations/api/operations.queries.ts";
import {
  DashboardOperationSearchSchema,
  mergeOperationSearch,
  operationFiltersFromSearch,
} from "#/features/operations/model/operation-search.ts";
import { DashboardContentLayout } from "#/shell/dashboard-layout.tsx";

export const Route = createFileRoute("/_dashboard/deliveries")({
  validateSearch: (search) => DashboardOperationSearchSchema.parse(search),
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps: search }) => {
    const filters = operationFiltersFromSearch(search);

    await Promise.all([
      context.queryClient.ensureQueryData(configurationQueryOptions()),
      context.queryClient.ensureQueryData(operationsQueryOptions(filters)),
    ]);

    return { filters };
  },
  component: DeliveriesRoute,
  pendingComponent: DashboardContentLayout.Skeleton,
  pendingMs: 120,
  pendingMinMs: 250,
});

function DeliveriesRoute() {
  const navigate = Route.useNavigate();
  const search = Route.useSearch();
  const { filters } = Route.useLoaderData();

  return (
    <DeliveriesPage
      search={search}
      filters={filters}
      onSearchChange={(next) => {
        void navigate({
          search: mergeOperationSearch(search, next) as never,
        });
      }}
    />
  );
}
