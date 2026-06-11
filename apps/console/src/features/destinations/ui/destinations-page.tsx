import { useSuspenseQuery } from "@tanstack/react-query";
import * as React from "react";

import { DashboardContentLayout } from "#/app/shell/dashboard-layout.tsx";
import { DashboardSidebar } from "#/app/shell/dashboard-sidebar.tsx";
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

export function DestinationsPage() {
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
      main={
        <>
          {formError ? (
            <div className="border-destructive/40 bg-destructive/10 text-destructive border px-3 py-2 text-xs">
              {formError}
            </div>
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
        <DashboardSidebar>
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
