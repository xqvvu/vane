import type { Configuration } from "#/features/configuration/model/configuration-types.ts";

type RouteSummary = Configuration["routes"][number];

export interface DestinationRouteCoverage {
  enabledRouteCount: number;
  disabledRouteCount: number;
  routeNames: string[];
}

export function destinationRouteCoverage(
  destinationId: string,
  routes: Configuration["routes"],
): DestinationRouteCoverage {
  const referencingRoutes = routes.filter((route) =>
    routeReferencesDestination(route, destinationId),
  );
  const enabledRoutes = referencingRoutes.filter((route) => route.enabled);

  return {
    enabledRouteCount: enabledRoutes.length,
    disabledRouteCount: referencingRoutes.length - enabledRoutes.length,
    routeNames: enabledRoutes.map((route) => route.name),
  };
}

function routeReferencesDestination(route: RouteSummary, destinationId: string): boolean {
  return route.destinationIds.includes(destinationId);
}
