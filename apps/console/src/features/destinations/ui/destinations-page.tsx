import { RiErrorWarningLine, RiRefreshLine } from "@remixicon/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import * as React from "react";

import { Alert, AlertDescription, AlertTitle } from "#/components/ui/alert.tsx";
import { Badge } from "#/components/ui/badge.tsx";
import { Button } from "#/components/ui/button.tsx";
import { configurationQueryOptions } from "#/features/configuration/api/configuration.queries.ts";
import type {
  DestinationPreviewNotice,
  DestinationTestNotice,
} from "#/features/configuration/model/configuration-types.ts";
import { useDestinationMutations } from "#/features/destinations/api/destination.mutations.ts";
import { CreateDestinationForm } from "#/features/destinations/ui/destination-forms.tsx";
import {
  DestinationPreviewNoticePanel,
  DestinationTestNoticePanel,
} from "#/features/destinations/ui/destination-notices.tsx";
import { DestinationsSection } from "#/features/destinations/ui/destinations-section.tsx";
import { useTranslations } from "#/i18n/use-i18n.ts";
import { DashboardContentLayout } from "#/shell/dashboard-layout.tsx";
import { DashboardSidebar } from "#/shell/dashboard-sidebar.tsx";

export function DestinationsPage() {
  const t = useTranslations();
  const { data: configuration } = useSuspenseQuery(configurationQueryOptions());
  const {
    createDestination,
    invalidateDestinations,
    previewDestination,
    previewDestinationDraft,
    previewDestinationUpdate,
    testDestination,
    updateDestination,
  } = useDestinationMutations();
  const [destinationTestNotice, setDestinationTestNotice] =
    React.useState<DestinationTestNotice | null>(null);
  const [destinationPreviewNotice, setDestinationPreviewNotice] =
    React.useState<DestinationPreviewNotice | null>(null);
  const [editingDestinationId, setEditingDestinationId] = React.useState<string | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [pendingAction, setPendingAction] = React.useState<string | null>(null);
  const editingDestination = editingDestinationId
    ? (configuration.destinations.find((destination) => destination.id === editingDestinationId) ??
      null)
    : null;
  const pending = pendingAction !== null;

  async function refreshConfiguration() {
    await invalidateDestinations();
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
          <DestinationsPageToolbar
            destinationCount={configuration.destinations.length}
            pending={pending}
            onRefresh={() => void refreshConfiguration()}
          />
          {formError ? (
            <Alert variant="destructive" className="mx-3 mt-4">
              <RiErrorWarningLine aria-hidden />
              <AlertTitle>{t("destinations.page.operationFailed")}</AlertTitle>
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          ) : null}
          {destinationTestNotice ? (
            <DestinationTestNoticePanel notice={destinationTestNotice} />
          ) : null}
          {destinationPreviewNotice ? (
            <DestinationPreviewNoticePanel notice={destinationPreviewNotice} />
          ) : null}
          <DestinationsSection
            destinations={configuration.destinations}
            editingDestination={editingDestination}
            pending={pending}
            onTest={(destination) =>
              void submitAction(`test-destination-${destination.id}`, async () => {
                const result = await testDestination({
                  data: {
                    id: destination.id,
                  },
                });
                setDestinationTestNotice(result);
                return result;
              })
            }
            onPreview={(destination) =>
              void submitAction(`preview-destination-${destination.id}`, async () => {
                const result = await previewDestination({
                  data: {
                    id: destination.id,
                  },
                });
                setDestinationPreviewNotice(result);
                return result;
              })
            }
            onEdit={setEditingDestinationId}
            onToggle={(destination) =>
              void submitAction(`toggle-destination-${destination.id}`, () =>
                updateDestination({
                  data: {
                    id: destination.id,
                    enabled: !destination.enabled,
                  },
                }),
              )
            }
            onCancelEdit={() => setEditingDestinationId(null)}
            onPreviewEdit={(input) => {
              if (!editingDestination) {
                return;
              }

              void submitAction(`preview-destination-update-${editingDestination.id}`, async () => {
                const result = await previewDestinationUpdate({
                  data: {
                    id: editingDestination.id,
                    name: input.name,
                    config: input.config,
                  },
                });
                setDestinationPreviewNotice(result);
                return result;
              });
            }}
            onSubmitEdit={(input) =>
              void submitAction(`edit-destination-${input.id}`, async () => {
                const result = await updateDestination({ data: input });
                setEditingDestinationId(null);
                return result;
              })
            }
          />
        </>
      }
      sidebar={
        <DashboardSidebar variant="split">
          <CreateDestinationForm
            pending={pending}
            onPreview={(input) =>
              void submitAction("preview-destination-draft", async () => {
                const result = await previewDestinationDraft({ data: input });
                setDestinationPreviewNotice(result);
                return result;
              })
            }
            onSubmit={(input) =>
              void submitAction("create-destination", () => createDestination({ data: input }))
            }
          />
        </DashboardSidebar>
      }
    />
  );
}

function DestinationsPageToolbar({
  destinationCount,
  pending,
  onRefresh,
}: {
  destinationCount: number;
  pending: boolean;
  onRefresh: () => void;
}) {
  const t = useTranslations();

  return (
    <header className="border-border bg-background flex flex-col gap-3 border-b px-3 py-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h1 className="font-heading text-2xl leading-none font-semibold">
            {t("destinations.page.title")}
          </h1>
          <Badge variant="outline" className="text-[10px] font-bold tracking-wider uppercase">
            {t("destinations.page.configured", { count: destinationCount })}
          </Badge>
        </div>
        <p className="text-muted-foreground mt-2 text-sm">{t("destinations.page.description")}</p>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={onRefresh}
        title={t("destinations.page.refreshTitle")}
        className="w-fit"
      >
        <RiRefreshLine data-icon="inline-start" aria-hidden />
        {t("common.actions.refresh")}
      </Button>
    </header>
  );
}
