import { RiErrorWarningLine, RiRefreshLine } from "@remixicon/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import * as React from "react";

import { Alert, AlertDescription, AlertTitle } from "#/components/ui/alert.tsx";
import { Badge } from "#/components/ui/badge.tsx";
import { Button } from "#/components/ui/button.tsx";
import { configurationQueryOptions } from "#/features/configuration/api/configuration.queries.ts";
import { useRouteMutations } from "#/features/routes/api/route.mutations.ts";
import { CreateRouteForm } from "#/features/routes/ui/route-forms.tsx";
import { RoutesSection } from "#/features/routes/ui/routes-section.tsx";
import { DashboardContentLayout } from "#/shell/dashboard-layout.tsx";
import { DashboardSidebar } from "#/shell/dashboard-sidebar.tsx";

export function RoutesPage() {
  const { data: configuration } = useSuspenseQuery(configurationQueryOptions());
  const { createRoute, invalidateRoutes, updateRoute } = useRouteMutations();
  const [editingRouteId, setEditingRouteId] = React.useState<string | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [pendingAction, setPendingAction] = React.useState<string | null>(null);
  const editingRoute = editingRouteId
    ? (configuration.routes.find((route) => route.id === editingRouteId) ?? null)
    : null;
  const pending = pendingAction !== null;

  async function refreshConfiguration() {
    await invalidateRoutes();
  }

  async function submitAction<T>(action: string, fn: () => Promise<T>): Promise<T | null> {
    setPendingAction(action);
    setFormError(null);

    try {
      const result = await fn();
      await refreshConfiguration();
      return result;
    } catch (error) {
      setFormError(error instanceof Error ? error.message : String(error));
      return null;
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <DashboardContentLayout
      variant="split"
      main={
        <>
          <RoutesPageToolbar
            routeCount={configuration.routes.length}
            pending={pending}
            onRefresh={() => void refreshConfiguration()}
          />
          {formError ? (
            <Alert variant="destructive" className="mx-3 mt-4">
              <RiErrorWarningLine aria-hidden />
              <AlertTitle>Route operation failed</AlertTitle>
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          ) : null}
          <RoutesSection
            routes={configuration.routes}
            sources={configuration.sources}
            destinations={configuration.destinations}
            editingRoute={editingRoute}
            pending={pending}
            onEdit={setEditingRouteId}
            onCancelEdit={() => setEditingRouteId(null)}
            onToggle={(route) =>
              void submitAction(`toggle-route-${route.id}`, () =>
                updateRoute({
                  data: {
                    id: route.id,
                    enabled: !route.enabled,
                  },
                }),
              )
            }
            onSubmitEdit={(input) =>
              void submitAction(`edit-route-${input.id}`, async () => {
                const result = await updateRoute({ data: input });
                setEditingRouteId(null);
                return result;
              })
            }
          />
        </>
      }
      sidebar={
        <DashboardSidebar variant="split">
          <CreateRouteForm
            sources={configuration.sources}
            destinations={configuration.destinations}
            pending={pending}
            onSubmit={(input) =>
              void submitAction("create-route", () => createRoute({ data: input }))
            }
          />
        </DashboardSidebar>
      }
    />
  );
}

function RoutesPageToolbar({
  routeCount,
  pending,
  onRefresh,
}: {
  routeCount: number;
  pending: boolean;
  onRefresh: () => void;
}) {
  return (
    <header className="border-border bg-background flex flex-col gap-3 border-b px-3 py-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h1 className="font-heading text-2xl leading-none font-semibold">Routes</h1>
          <Badge variant="outline" className="text-[10px] font-bold tracking-wider uppercase">
            {routeCount} configured
          </Badge>
        </div>
        <p className="text-muted-foreground mt-2 text-sm">
          Match normalized event fields and fan out matching events to destinations.
        </p>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={onRefresh}
        title="Refresh route configuration"
        className="w-fit"
      >
        <RiRefreshLine data-icon="inline-start" aria-hidden />
        Refresh
      </Button>
    </header>
  );
}
