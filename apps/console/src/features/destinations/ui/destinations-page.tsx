import { RiErrorWarningLine, RiRefreshLine } from "@remixicon/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import * as React from "react";

import { Alert, AlertDescription, AlertTitle } from "#/components/ui/alert.tsx";
import { Button } from "#/components/ui/button.tsx";
import { configurationQueryOptions } from "#/features/configuration/api/configuration.queries.ts";
import type {
  DestinationPreviewNotice,
  DestinationTestNotice,
} from "#/features/configuration/model/configuration-types.ts";
import { useDestinationMutations } from "#/features/destinations/api/destination.mutations.ts";
import { DestinationAddDialog } from "#/features/destinations/ui/destination-add-dialog.tsx";
import { DestinationEditDialog } from "#/features/destinations/ui/destination-edit-dialog.tsx";
import {
  DestinationPreviewDialog,
  DestinationTestNoticePanel,
} from "#/features/destinations/ui/destination-notices.tsx";
import type {
  CreateDestinationFormInput,
  EditDestinationFormInput,
} from "#/features/destinations/ui/destination-ui-types.ts";
import { DestinationsPageToolbar } from "#/features/destinations/ui/destinations-page-toolbar.tsx";
import { DestinationsSection } from "#/features/destinations/ui/destinations-section.tsx";
import { useTranslations } from "#/i18n/use-i18n.ts";
import { DashboardContentLayout } from "#/shell/dashboard-layout.tsx";

export function DestinationsPage() {
  const t = useTranslations();
  const { data: configuration } = useSuspenseQuery(configurationQueryOptions());
  const {
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
  const [previewDialogOpen, setPreviewDialogOpen] = React.useState(false);
  const [editingDestinationId, setEditingDestinationId] = React.useState<string | null>(null);
  const [destinationEditorOpen, setDestinationEditorOpen] = React.useState(false);
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

  async function runAction<T>(
    action: string,
    fn: () => Promise<T>,
    options: { refresh?: boolean } = {},
  ): Promise<T | null> {
    setPendingAction(action);
    setFormError(null);

    try {
      const result = await fn();

      if (options.refresh) {
        await refreshConfiguration();
      }

      return result;
    } catch (error) {
      setFormError(error instanceof Error ? error.message : String(error));
      return null;
    } finally {
      setPendingAction(null);
    }
  }

  async function submitAction<T>(action: string, fn: () => Promise<T>): Promise<T | null> {
    return runAction(action, fn, { refresh: true });
  }

  function previewDraft(input: CreateDestinationFormInput) {
    return runAction("preview-destination-draft", async () => {
      const result = await previewDestinationDraft({ data: input });
      setDestinationPreviewNotice(result);
      setPreviewDialogOpen(true);
      return result;
    });
  }

  function previewEdit(input: EditDestinationFormInput) {
    return runAction(`preview-destination-update-${input.id}`, async () => {
      const result = await previewDestinationUpdate({
        data: {
          id: input.id,
          name: input.name,
          config: input.config,
        },
      });
      setDestinationPreviewNotice(result);
      setPreviewDialogOpen(true);
      return result;
    });
  }

  return (
    <DashboardContentLayout
      main={
        <>
          <DestinationsPageToolbar
            actions={
              <>
                <DestinationAddDialog disabled={pending} onPreview={previewDraft} />

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={pending}
                  onClick={() => void refreshConfiguration()}
                  title={t("destinations.page.refreshTitle")}
                  className="w-fit"
                >
                  <RiRefreshLine data-icon="inline-start" aria-hidden />
                  {t("common.actions.refresh")}
                </Button>
              </>
            }
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
          <DestinationPreviewDialog
            notice={destinationPreviewNotice}
            open={previewDialogOpen && destinationPreviewNotice !== null}
            onOpenChange={(open) => {
              setPreviewDialogOpen(open);
            }}
          />
          <DestinationsSection
            destinations={configuration.destinations}
            routes={configuration.routes}
            pending={pending}
            onTest={(destination) =>
              void runAction(`test-destination-${destination.id}`, async () => {
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
              void runAction(`preview-destination-${destination.id}`, async () => {
                const result = await previewDestination({
                  data: {
                    id: destination.id,
                  },
                });
                setDestinationPreviewNotice(result);
                setPreviewDialogOpen(true);
                return result;
              })
            }
            onEdit={(destinationId) => {
              setEditingDestinationId(destinationId);
              setDestinationEditorOpen(true);
            }}
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
          />

          <DestinationEditDialog
            destination={editingDestination}
            open={destinationEditorOpen && editingDestination !== null}
            disabled={pending}
            onOpenChange={(open) => {
              setDestinationEditorOpen(open);
            }}
            onPreview={previewEdit}
          />
        </>
      }
    />
  );
}
