import { createFileRoute } from "@tanstack/react-router";

import { configurationQueryOptions } from "#/features/configuration/api/configuration.queries.ts";
import { RoutesPage } from "#/features/routes/ui/routes-page.tsx";

export const Route = createFileRoute("/_dashboard/routes")({
  loader: ({ context }) => context.queryClient.ensureQueryData(configurationQueryOptions()),
  component: RoutesPage,
});
