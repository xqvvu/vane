import { useSuspenseQuery } from "@tanstack/react-query";
import * as React from "react";

import { DashboardContentLayout } from "#/app/shell/dashboard-layout.tsx";
import { DashboardSidebar } from "#/app/shell/dashboard-sidebar.tsx";
import { configurationQueryOptions } from "#/features/configuration/api/configuration.queries.ts";
import { useRouteMutations } from "#/features/routes/api/route.mutations.ts";
import { CreateRouteForm } from "#/features/routes/ui/route-forms.tsx";
import { RoutesSection } from "#/features/routes/ui/routes-section.tsx";

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
      main={
        <>
          {formError ? (
            <div className="border-destructive/40 bg-destructive/10 text-destructive border px-3 py-2 text-xs">
              {formError}
            </div>
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
        <DashboardSidebar>
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
