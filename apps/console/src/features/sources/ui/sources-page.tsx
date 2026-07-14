import { RiRefreshLine } from "@remixicon/react";
import { useSuspenseQueries } from "@tanstack/react-query";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "#/components/ui/button.tsx";
import { routesQueryOptions } from "#/features/routes/api/route.queries.ts";
import { useSourceMutations } from "#/features/sources/api/source.mutations.ts";
import { sourcesQueryOptions } from "#/features/sources/api/source.queries.ts";
import { sourceWebhookPath } from "#/features/sources/model/source-webhook.ts";
import { SourcesAddDialog } from "#/features/sources/ui/source-add-dialog.tsx";
import { SourcesEditDialog } from "#/features/sources/ui/source-edit-dialog.tsx";
import {
  SourceTokenNoticePanel,
  type SourceTokenNotice,
} from "#/features/sources/ui/source-token-notice-panel.tsx";
import { SourcesPageToolbar } from "#/features/sources/ui/sources-page-toolbar.tsx";
import { SourcesSection } from "#/features/sources/ui/sources-section.tsx";
import { useTranslations } from "#/i18n/use-i18n.ts";
import { DashboardContentLayout } from "#/shell/dashboard-layout.tsx";

export function SourcesPage() {
  const t = useTranslations();
  const [{ data: sources }, { data: routes }] = useSuspenseQueries({
    queries: [sourcesQueryOptions(), routesQueryOptions()],
  });
  const { deleteSource, invalidateSources, rotateSourceToken, updateSource } = useSourceMutations();
  const [tokenNotice, setTokenNotice] = React.useState<SourceTokenNotice | null>(null);
  const [editingSourceId, setEditingSourceId] = React.useState<string | null>(null);
  const [sourceEditorOpen, setSourceEditorOpen] = React.useState(false);
  const [pendingAction, setPendingAction] = React.useState<string | null>(null);
  const editingSource = editingSourceId
    ? (sources.find((source) => source.id === editingSourceId) ?? null)
    : null;
  const pending = pendingAction !== null;

  async function refreshConfiguration(): Promise<boolean> {
    try {
      await invalidateSources();
      return true;
    } catch (error) {
      toast.error(t("sources.page.operationFailed"), {
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
      toast.error(t("sources.page.operationFailed"), {
        description: error instanceof Error ? error.message : String(error),
      });
      return null;
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <DashboardContentLayout
      main={
        <>
          <SourcesPageToolbar
            actions={
              <>
                <SourcesAddDialog disabled={pending} onCreated={setTokenNotice} />

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={pending}
                  onClick={() => void refreshConfiguration()}
                  title={t("sources.page.refreshTitle")}
                  className="w-fit"
                >
                  <RiRefreshLine data-icon="inline-start" aria-hidden />
                  {t("common.actions.refresh")}
                </Button>
              </>
            }
          />

          {tokenNotice ? (
            <SourceTokenNoticePanel notice={tokenNotice} onDismiss={() => setTokenNotice(null)} />
          ) : null}

          <SourcesSection
            sources={sources}
            routes={routes}
            pending={pending}
            onEdit={(sourceId) => {
              setEditingSourceId(sourceId);
              setSourceEditorOpen(true);
            }}
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
            onDelete={(source) =>
              void submitAction(`delete-source-${source.id}`, () =>
                deleteSource({
                  data: {
                    id: source.id,
                  },
                }),
              )
            }
          />

          <SourcesEditDialog
            source={editingSource}
            open={sourceEditorOpen && editingSource !== null}
            disabled={pending}
            onOpenChange={(open) => {
              setSourceEditorOpen(open);
            }}
          />
        </>
      }
    />
  );
}
