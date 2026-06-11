import { createFileRoute } from "@tanstack/react-router";

import { configurationQueryOptions } from "#/features/configuration/api/configuration.queries.ts";
import { EventsPage } from "#/features/events/ui/events-page.tsx";
import { operationsQueryOptions } from "#/features/operations/api/operations.queries.ts";
import {
  DashboardOperationSearchSchema,
  mergeOperationSearch,
  operationFiltersFromSearch,
} from "#/features/operations/model/operation-search.ts";

export const Route = createFileRoute("/_dashboard/events")({
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
  component: EventsRoute,
});

function EventsRoute() {
  const navigate = Route.useNavigate();
  const search = Route.useSearch();
  const { filters } = Route.useLoaderData();

  return (
    <EventsPage
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
