import { useSuspenseQuery } from "@tanstack/react-query";
import * as React from "react";

import { DashboardContentLayout } from "#/app/shell/dashboard-layout.tsx";
import { DashboardSidebar } from "#/app/shell/dashboard-sidebar.tsx";
import { configurationQueryOptions } from "#/features/configuration/api/configuration.queries.ts";
import { useSourceMutations } from "#/features/sources/api/source.mutations.ts";
import { sourceWebhookPath } from "#/features/sources/model/source-webhook.ts";
import { CreateSourceForm } from "#/features/sources/ui/source-forms.tsx";
import {
  SourceTokenNoticePanel,
  type SourceTokenNotice,
} from "#/features/sources/ui/source-token-notice-panel.tsx";
import { SourcesSection } from "#/features/sources/ui/sources-section.tsx";

export function SourcesPage() {
  const { data: configuration } = useSuspenseQuery(configurationQueryOptions());
  const { createSource, invalidateSources, rotateSourceToken, updateSource } = useSourceMutations();
  const [tokenNotice, setTokenNotice] = React.useState<SourceTokenNotice | null>(null);
  const [editingSourceId, setEditingSourceId] = React.useState<string | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [pendingAction, setPendingAction] = React.useState<string | null>(null);
  const editingSource = editingSourceId
    ? (configuration.sources.find((source) => source.id === editingSourceId) ?? null)
    : null;
  const pending = pendingAction !== null;

  async function refreshConfiguration() {
    await invalidateSources();
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
          {tokenNotice ? <SourceTokenNoticePanel notice={tokenNotice} /> : null}
          <SourcesSection
            sources={configuration.sources}
            editingSource={editingSource}
            pending={pending}
            onEdit={setEditingSourceId}
            onCancelEdit={() => setEditingSourceId(null)}
            onToggle={(source) =>
              void submitAction(`toggle-source-${source.id}`, () =>
                updateSource({
                  data: {
                    id: source.id,
                    enabled: !source.enabled,
                  },
                }),
              )
            }
            onRotateToken={(source) =>
              void submitAction(`rotate-source-${source.id}`, async () => {
                const result = await rotateSourceToken({
                  data: {
                    id: source.id,
                  },
                });
                setTokenNotice({
                  sourceName: result.source.name,
                  webhookPath: sourceWebhookPath(result.source.id),
                  token: result.token,
                });
                return result;
              })
            }
            onSubmitEdit={(input) =>
              void submitAction(`edit-source-${input.id}`, async () => {
                const result = await updateSource({ data: input });
                setEditingSourceId(null);
                return result;
              })
            }
          />
        </>
      }
      sidebar={
        <DashboardSidebar>
          <CreateSourceForm
            pending={pending}
            onSubmit={(input) =>
              void submitAction("create-source", async () => {
                const result = await createSource({ data: input });
                setTokenNotice({
                  sourceName: result.source.name,
                  webhookPath: sourceWebhookPath(result.source.id),
                  token: result.token,
                });
                return result;
              })
            }
          />
        </DashboardSidebar>
      }
    />
  );
}
