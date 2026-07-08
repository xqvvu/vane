import { RiRefreshLine } from "@remixicon/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "#/components/ui/button.tsx";
import {
  configurationQueryOptions,
  destinationCatalogQueryOptions,
} from "#/features/configuration/api/configuration.queries.ts";
import type { DestinationPreviewNotice } from "#/features/configuration/model/configuration-types.ts";
import { useDestinationMutations } from "#/features/destinations/api/destination.mutations.ts";
import { DestinationAddDialog } from "#/features/destinations/ui/destination-add-dialog.tsx";
import { DestinationEditDialog } from "#/features/destinations/ui/destination-edit-dialog.tsx";
import {
  DestinationPreviewDialog,
  showDestinationTestToast,
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
  const { data: destinationCatalog } = useSuspenseQuery(destinationCatalogQueryOptions());
  const {
    deleteDestination,
    invalidateDestinations,
    previewDestination,
    previewDestinationDraft,
    previewDestinationUpdate,
    testDestination,
    updateDestination,
  } = useDestinationMutations();
  const [destinationPreviewNotice, setDestinationPreviewNotice] =
    React.useState<DestinationPreviewNotice | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = React.useState(false);
  const [editingDestinationId, setEditingDestinationId] = React.useState<string | null>(null);
  const [destinationEditorOpen, setDestinationEditorOpen] = React.useState(false);
  const [pendingAction, setPendingAction] = React.useState<string | null>(null);
  const editingDestination = editingDestinationId
    ? (configuration.destinations.find((destination) => destination.id === editingDestinationId) ??
      null)
    : null;
  const pending = pendingAction !== null;

  async function refreshConfiguration(): Promise<boolean> {
    try {
      await invalidateDestinations();
      return true;
    } catch (error) {
      toast.error(t("destinations.page.operationFailed"), {
        description: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  async function runAction<T>(
    action: string,
    fn: () => Promise<T>,
    options: { refresh?: boolean } = {},
  ): Promise<T | null> {
    setPendingAction(action);

    try {
      const result = await fn();

      if (options.refresh) {
        await refreshConfiguration();
      }

      return result;
    } catch (error) {
      toast.error(t("destinations.page.operationFailed"), {
        description: error instanceof Error ? error.message : String(error),
      });
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
                <DestinationAddDialog
                  destinationCatalog={destinationCatalog}
                  disabled={pending}
                  onPreview={previewDraft}
                />

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
                showDestinationTestToast(result, t);
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
            onDelete={(destination) =>
              void submitAction(`delete-destination-${destination.id}`, () =>
                deleteDestination({
                  data: {
                    id: destination.id,
                  },
                }),
              )
            }
          />

          <DestinationEditDialog
            destinationCatalog={destinationCatalog}
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
