import { RiRefreshLine } from "@remixicon/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import * as React from "react";
import { toast } from "sonner";

import { PageToolbar } from "#/components/common/page-toolbar.tsx";
import { Button } from "#/components/ui/button.tsx";
import { configurationQueryOptions } from "#/features/configuration/api/configuration.queries.ts";
import type { Configuration } from "#/features/configuration/model/configuration-types.ts";
import { useRouteMutations } from "#/features/routes/api/route.mutations.ts";
import { RouteAddDialog } from "#/features/routes/ui/route-add-dialog.tsx";
import { RouteReplayPrompt } from "#/features/routes/ui/route-replay-prompt.tsx";
import { RoutesSection } from "#/features/routes/ui/routes-section.tsx";
import { useTranslations } from "#/i18n/use-i18n.ts";
import { DashboardContentLayout } from "#/shell/dashboard-layout.tsx";

export function RoutesPage() {
  const t = useTranslations();
  const { data: configuration } = useSuspenseQuery(configurationQueryOptions());
  const { createRoute, deleteRoute, invalidateRoutes, updateRoute } = useRouteMutations();
  const [editingRouteId, setEditingRouteId] = React.useState<string | null>(null);
  const [replayRouteId, setReplayRouteId] = React.useState<string | null>(null);
  const [pendingAction, setPendingAction] = React.useState<string | null>(null);
  const editingRoute = editingRouteId
    ? (configuration.routes.find((route) => route.id === editingRouteId) ?? null)
    : null;
  const pending = pendingAction !== null;

  async function refreshConfiguration(): Promise<boolean> {
    try {
      await invalidateRoutes();
      return true;
    } catch (error) {
      toast.error(t("routing.page.operationFailed"), {
        description: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  async function submitAction<T>(action: string, fn: () => Promise<T>): Promise<T | null> {
    setPendingAction(action);

    try {
      const result = await fn();
      await refreshConfiguration();
      return result;
    } catch (error) {
      toast.error(t("routing.page.operationFailed"), {
        description: error instanceof Error ? error.message : String(error),
      });
      return null;
    } finally {
      setPendingAction(null);
    }
  }

  function maybeOpenRouteReplay(route: Configuration["routes"][number] | null): void {
    if (route?.enabled) {
      setReplayRouteId(route.id);
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
              void submitAction("create-route", () => createRoute({ data: input })).then(
                maybeOpenRouteReplay,
              )
            }
            onRefresh={() => void refreshConfiguration()}
          />
          <RoutesSection
            routes={configuration.routes}
            sources={configuration.sources}
            destinations={configuration.destinations}
            editingRoute={editingRoute}
            pending={pending}
            onEdit={setEditingRouteId}
            onCancelEdit={() => setEditingRouteId(null)}
            onPreviewReplay={(route) => setReplayRouteId(route.id)}
            onToggle={(route) =>
              void submitAction(`toggle-route-${route.id}`, () =>
                updateRoute({
                  data: {
                    id: route.id,
                    enabled: !route.enabled,
                  },
                }),
              ).then(maybeOpenRouteReplay)
            }
            onDelete={(route) =>
              void submitAction(`delete-route-${route.id}`, () =>
                deleteRoute({
                  data: {
                    id: route.id,
                  },
                }),
              )
            }
            onSubmitEdit={(input) =>
              void submitAction(`edit-route-${input.id}`, async () => {
                const result = await updateRoute({ data: input });
                setEditingRouteId(null);
                return result;
              }).then(maybeOpenRouteReplay)
            }
          />
          <RouteReplayPrompt routeId={replayRouteId} onClose={() => setReplayRouteId(null)} />
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
