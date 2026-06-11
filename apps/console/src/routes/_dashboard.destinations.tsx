import { createFileRoute } from "@tanstack/react-router";

import { configurationQueryOptions } from "#/features/configuration/api/configuration.queries.ts";
import { DestinationsPage } from "#/features/destinations/ui/destinations-page.tsx";

export const Route = createFileRoute("/_dashboard/destinations")({
  loader: ({ context }) => context.queryClient.ensureQueryData(configurationQueryOptions()),
  component: DestinationsPage,
});
