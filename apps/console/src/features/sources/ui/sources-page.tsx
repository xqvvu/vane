import { RiErrorWarningLine } from "@remixicon/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import * as React from "react";

import { Alert, AlertDescription, AlertTitle } from "#/components/ui/alert.tsx";
import { configurationQueryOptions } from "#/features/configuration/api/configuration.queries.ts";
import { useSourceMutations } from "#/features/sources/api/source.mutations.ts";
import { sourceWebhookPath } from "#/features/sources/model/source-webhook.ts";
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
  const { data: configuration } = useSuspenseQuery(configurationQueryOptions());
  const { invalidateSources, rotateSourceToken, updateSource } = useSourceMutations();
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
          <SourcesPageToolbar
            sourceCount={configuration.sources.length}
            pending={pending}
            onSourceCreated={setTokenNotice}
            onRefresh={() => void refreshConfiguration()}
          />

          {formError ? (
            <Alert variant="destructive" className="mx-3 mt-4">
              <RiErrorWarningLine aria-hidden />
              <AlertTitle>{t("sources.page.operationFailed")}</AlertTitle>
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          ) : null}

          {tokenNotice ? (
            <SourceTokenNoticePanel notice={tokenNotice} onDismiss={() => setTokenNotice(null)} />
          ) : null}

          <SourcesSection
            sources={configuration.sources}
            pending={pending}
            onEdit={setEditingSourceId}
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
          />

          <SourcesEditDialog
            source={editingSource}
            open={editingSource !== null}
            disabled={pending}
            onOpenChange={(open) => {
              if (!open) {
                setEditingSourceId(null);
              }
            }}
          />
        </>
      }
    />
  );
}
