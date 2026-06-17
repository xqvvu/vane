import { RiErrorWarningLine, RiRefreshLine } from "@remixicon/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import * as React from "react";

import { PageToolbar } from "#/components/common/page-toolbar.tsx";
import { Alert, AlertDescription, AlertTitle } from "#/components/ui/alert.tsx";
import { Button } from "#/components/ui/button.tsx";
import { configurationQueryOptions } from "#/features/configuration/api/configuration.queries.ts";
import type { Configuration } from "#/features/configuration/model/configuration-types.ts";
import { useRouteMutations } from "#/features/routes/api/route.mutations.ts";
import { RouteAddDialog } from "#/features/routes/ui/route-add-dialog.tsx";
import { RoutesSection } from "#/features/routes/ui/routes-section.tsx";
import { useTranslations } from "#/i18n/use-i18n.ts";
import { DashboardContentLayout } from "#/shell/dashboard-layout.tsx";

export function RoutesPage() {
  const t = useTranslations();
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
          <RoutesPageToolbar
            pending={pending}
            sources={configuration.sources}
            destinations={configuration.destinations}
            onCreate={(input) =>
              void submitAction("create-route", () => createRoute({ data: input }))
            }
            onRefresh={() => void refreshConfiguration()}
          />
          {formError ? (
            <Alert variant="destructive" className="mx-3 mt-4">
              <RiErrorWarningLine aria-hidden />
              <AlertTitle>{t("routing.page.operationFailed")}</AlertTitle>
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
    />
  );
}

function RoutesPageToolbar({
  pending,
  sources,
  destinations,
  onCreate,
  onRefresh,
}: {
  pending: boolean;
  sources: Configuration["sources"];
  destinations: Configuration["destinations"];
  onCreate: (input: {
    name: string;
    rule: Configuration["routes"][number]["rule"];
    destinationIds: string[];
  }) => void;
  onRefresh: () => void;
}) {
  const t = useTranslations();

  return (
    <PageToolbar
      description={t("routing.page.description")}
      actions={
        <>
          <RouteAddDialog
            sources={sources}
            destinations={destinations}
            pending={pending}
            onSubmit={onCreate}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={onRefresh}
            title={t("routing.page.refreshTitle")}
            className="w-fit"
          >
            <RiRefreshLine data-icon="inline-start" aria-hidden />
            {t("common.actions.refresh")}
          </Button>
        </>
      }
    />
  );
}
