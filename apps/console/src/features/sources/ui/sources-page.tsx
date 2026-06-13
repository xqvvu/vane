import { RiErrorWarningLine, RiRefreshLine, RiRouteLine } from "@remixicon/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import * as React from "react";

import { Alert, AlertDescription, AlertTitle } from "#/components/ui/alert.tsx";
import { Badge } from "#/components/ui/badge.tsx";
import { Button } from "#/components/ui/button.tsx";
import { configurationQueryOptions } from "#/features/configuration/api/configuration.queries.ts";
import { useSourceMutations } from "#/features/sources/api/source.mutations.ts";
import { sourceWebhookPath } from "#/features/sources/model/source-webhook.ts";
import { CreateSourceForm } from "#/features/sources/ui/source-forms.tsx";
import {
  SourceTokenNoticePanel,
  type SourceTokenNotice,
} from "#/features/sources/ui/source-token-notice-panel.tsx";
import { SourcesSection } from "#/features/sources/ui/sources-section.tsx";
import { useTranslations } from "#/i18n/use-i18n.ts";
import { DashboardContentLayout } from "#/shell/dashboard-layout.tsx";
import { DashboardSidebar } from "#/shell/dashboard-sidebar.tsx";

export function SourcesPage() {
  const t = useTranslations();
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
      variant="split"
      main={
        <>
          <SourcesPageToolbar
            sourceCount={configuration.sources.length}
            pending={pending}
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
        <DashboardSidebar variant="split">
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
          <SourcesQuickTip />
        </DashboardSidebar>
      }
    />
  );
}

function SourcesPageToolbar({
  sourceCount,
  pending,
  onRefresh,
}: {
  sourceCount: number;
  pending: boolean;
  onRefresh: () => void;
}) {
  const t = useTranslations();

  return (
    <header className="border-border bg-background flex flex-col gap-3 border-b px-3 py-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h1 className="font-heading text-2xl leading-none font-semibold">
            {t("sources.page.quickTip.title")}
          </h1>
          <Badge variant="outline" className="text-[10px] font-bold tracking-wider uppercase">
            {t("sources.page.configured", { count: sourceCount })}
          </Badge>
        </div>
        <p className="text-muted-foreground mt-2 text-sm">{t("sources.page.description")}</p>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={onRefresh}
        title={t("sources.page.refreshTitle")}
        className="w-fit"
      >
        <RiRefreshLine data-icon="inline-start" aria-hidden />
        {t("common.actions.refresh")}
      </Button>
    </header>
  );
}

function SourcesQuickTip() {
  const t = useTranslations();

  return (
    <section className="border-primary/30 bg-background/50 border p-4">
      <h2 className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">
        {t("sources.page.quickTip.title")}
      </h2>
      <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
        {t("sources.page.quickTip.beforeLink")}
        <Link to="/routes" className="text-primary inline-flex items-center gap-1 font-semibold">
          {t("sources.page.quickTip.routeSettings")}
          <RiRouteLine aria-hidden className="size-3" />
        </Link>
        {t("sources.page.quickTip.afterLink")}
      </p>
    </section>
  );
}
