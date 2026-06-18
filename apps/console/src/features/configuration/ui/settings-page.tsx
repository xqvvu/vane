import { RiDatabase2Line, RiRefreshLine, RiShieldKeyholeLine } from "@remixicon/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ClientOnly } from "@tanstack/react-router";
import * as React from "react";
import { toast } from "sonner";

import { FormPanel, ContentPanel } from "#/components/common/content-panel.tsx";
import { PageToolbar } from "#/components/common/page-toolbar.tsx";
import { Button } from "#/components/ui/button.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs.tsx";
import { useConfigurationMutations } from "#/features/configuration/api/configuration.mutations.ts";
import { configurationQueryOptions } from "#/features/configuration/api/configuration.queries.ts";
import type { ImportConfigurationResult } from "#/features/configuration/model/configuration-types.ts";
import { AppSettingsForm } from "#/features/configuration/ui/app-settings-form.tsx";
import { ImportNoticePanel } from "#/features/configuration/ui/import-notice-panel.tsx";
import { OperationalSummary } from "#/features/configuration/ui/operational-summary.tsx";
import { PortableConfigForm } from "#/features/configuration/ui/portable-config-form.tsx";
import { LanguageSelector } from "#/i18n/language-switcher.tsx";
import { useTranslations } from "#/i18n/use-i18n.ts";
import { downloadTextFile } from "#/lib/browser.ts";
import { DashboardContentLayout } from "#/shell/dashboard-layout.tsx";

export function SettingsPage() {
  const t = useTranslations();
  const { data: configuration } = useSuspenseQuery(configurationQueryOptions());
  const {
    exportConfigurationToml,
    importConfigurationToml,
    invalidateConfiguration,
    updateAppSettings,
  } = useConfigurationMutations();
  const [configToml, setConfigToml] = React.useState("");
  const [importNotice, setImportNotice] = React.useState<ImportConfigurationResult | null>(null);
  const [pendingAction, setPendingAction] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<"ui" | "toml">("ui");
  const [hasLoadedToml, setHasLoadedToml] = React.useState(false);
  const [hasTriedAutoLoadToml, setHasTriedAutoLoadToml] = React.useState(false);
  const pending = pendingAction !== null;

  const loadCurrentToml = React.useCallback(async () => {
    const result = await exportConfigurationToml({
      data: {
        includeSecrets: false,
      },
    });

    setConfigToml(result.toml);
    setHasLoadedToml(true);
    return result.toml;
  }, [exportConfigurationToml]);

  React.useEffect(() => {
    if (activeTab !== "toml" || hasLoadedToml || hasTriedAutoLoadToml || pending) {
      return;
    }

    setHasTriedAutoLoadToml(true);
    setPendingAction("load-config-toml");

    void loadCurrentToml()
      .catch((error: unknown) => {
        toast.error(t("configuration.settings.operationFailed"), {
          description: error instanceof Error ? error.message : String(error),
        });
      })
      .finally(() => {
        setPendingAction(null);
      });
  }, [activeTab, hasLoadedToml, hasTriedAutoLoadToml, loadCurrentToml, pending, t]);

  function invalidateTomlDraft() {
    setHasLoadedToml(false);
    setHasTriedAutoLoadToml(false);

    if (activeTab !== "toml") {
      setConfigToml("");
    }
  }

  async function refreshConfiguration(
    options: { invalidateToml?: boolean } = {},
  ): Promise<boolean> {
    try {
      await invalidateConfiguration();

      if (options.invalidateToml) {
        invalidateTomlDraft();
      }

      return true;
    } catch (error) {
      toast.error(t("configuration.settings.operationFailed"), {
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
      toast.error(t("configuration.settings.operationFailed"), {
        description: error instanceof Error ? error.message : String(error),
      });
      return null;
    } finally {
      setPendingAction(null);
    }
  }

  async function submitConfigurationChange<T>(action: string, fn: () => Promise<T>) {
    const result = await submitAction(action, fn);

    if (result) {
      invalidateTomlDraft();
    }

    return result;
  }

  return (
    <DashboardContentLayout
      main={
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value === "toml" ? "toml" : "ui")}
          className="gap-4"
        >
          <SettingsPageToolbar
            pending={pending}
            onRefresh={() => void refreshConfiguration({ invalidateToml: true })}
          />
          {importNotice ? (
            <div className="min-h-0">
              <ImportNoticePanel notice={importNotice} />
            </div>
          ) : null}
          <TabsContent value="ui" className="flex flex-col gap-4">
            <ContentPanel
              title={t("configuration.summary.title")}
              icon={<RiDatabase2Line className="size-4" aria-hidden />}
            >
              <OperationalSummary
                configuration={configuration}
                retentionDays={configuration.settings.rawPayloadRetentionDays}
              />
            </ContentPanel>
            <div className="grid gap-4 lg:grid-cols-2">
              <AppSettingsForm
                settings={configuration.settings}
                pending={pending}
                onSubmit={(input) =>
                  void submitConfigurationChange("update-settings", () =>
                    updateAppSettings({ data: input }),
                  )
                }
              />
              <LanguageSettingsPanel />
            </div>
          </TabsContent>
          <TabsContent value="toml">
            {activeTab === "toml" ? (
              <PortableConfigForm
                value={configToml}
                pending={pending}
                onChange={setConfigToml}
                onExport={() =>
                  submitAction("export-config", async () => {
                    const toml = await loadCurrentToml();

                    downloadTextFile({
                      filename: "vane.toml",
                      text: toml,
                      type: "application/toml;charset=utf-8",
                    });

                    return { toml };
                  })
                }
                onImport={(toml) =>
                  submitConfigurationChange("import-config", async () => {
                    const result = await importConfigurationToml({
                      data: {
                        toml,
                      },
                    });
                    setImportNotice(result);
                    return result;
                  })
                }
              />
            ) : null}
          </TabsContent>
        </Tabs>
      }
    />
  );
}

function SettingsPageToolbar({ pending, onRefresh }: { pending: boolean; onRefresh: () => void }) {
  const t = useTranslations();

  return (
    <PageToolbar
      description={t("configuration.settings.description")}
      tabs={
        <TabsList
          variant="line"
          aria-label={t("configuration.settings.tabsLabel")}
          className="h-9 min-w-0 gap-6 p-0"
        >
          <TabsTrigger value="ui" className="px-0 text-sm">
            {t("configuration.settings.uiTab")}
          </TabsTrigger>
          <TabsTrigger value="toml" className="px-0 text-sm">
            {t("configuration.settings.tomlTab")}
          </TabsTrigger>
        </TabsList>
      }
      actions={
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={onRefresh}
          title={t("configuration.settings.refreshTitle")}
          className="shrink-0"
        >
          <RiRefreshLine data-icon="inline-start" aria-hidden />
          {t("common.actions.refresh")}
        </Button>
      }
    />
  );
}

function LanguageSettingsPanel() {
  const t = useTranslations();

  return (
    <FormPanel
      title={t("configuration.settings.languageTitle")}
      icon={<RiShieldKeyholeLine className="size-4" aria-hidden />}
    >
      <p className="text-muted-foreground mb-3 text-xs leading-5">
        {t("configuration.settings.languageDescription")}
      </p>
      <ClientOnly fallback={<LanguageSelector.Skeleton />}>
        <React.Suspense fallback={<LanguageSelector.Skeleton />}>
          <LanguageSelector />
        </React.Suspense>
      </ClientOnly>
    </FormPanel>
  );
}
