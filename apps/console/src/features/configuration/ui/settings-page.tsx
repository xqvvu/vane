import {
  RiDatabase2Line,
  RiErrorWarningLine,
  RiRefreshLine,
  RiShieldKeyholeLine,
} from "@remixicon/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ClientOnly } from "@tanstack/react-router";
import * as React from "react";

import { Alert, AlertDescription, AlertTitle } from "#/components/ui/alert.tsx";
import { Badge } from "#/components/ui/badge.tsx";
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
import { DashboardContentLayout } from "#/shell/dashboard-layout.tsx";
import { DashboardFormPanel, DashboardPanel } from "#/shell/dashboard-panel.tsx";

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
  const [formError, setFormError] = React.useState<string | null>(null);
  const [pendingAction, setPendingAction] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<"ui" | "toml">("ui");
  const pending = pendingAction !== null;

  async function refreshConfiguration() {
    await invalidateConfiguration();
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
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value === "toml" ? "toml" : "ui")}
          className="gap-4"
        >
          <SettingsPageToolbar pending={pending} onRefresh={() => void refreshConfiguration()} />
          {formError || importNotice ? (
            <div className="min-h-0">
              {formError ? (
                <Alert variant="destructive">
                  <RiErrorWarningLine aria-hidden />
                  <AlertTitle>{t("configuration.settings.operationFailed")}</AlertTitle>
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              ) : importNotice ? (
                <ImportNoticePanel notice={importNotice} />
              ) : null}
            </div>
          ) : null}
          <TabsContent value="ui" className="flex flex-col gap-4">
            <DashboardPanel
              title={t("configuration.summary.title")}
              icon={<RiDatabase2Line className="size-4" aria-hidden />}
            >
              <OperationalSummary
                configuration={configuration}
                retentionDays={configuration.settings.rawPayloadRetentionDays}
              />
            </DashboardPanel>
            <div className="grid gap-4 lg:grid-cols-2">
              <AppSettingsForm
                settings={configuration.settings}
                pending={pending}
                onSubmit={(input) =>
                  void submitAction("update-settings", () => updateAppSettings({ data: input }))
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
                    const result = await exportConfigurationToml({
                      data: {
                        includeSecrets: false,
                      },
                    });
                    setConfigToml(result.toml);
                    return result;
                  })
                }
                onImport={(toml) =>
                  submitAction("import-config", async () => {
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
    <header className="border-border bg-card flex min-w-0 flex-col gap-3 border p-4">
      <div className="flex min-w-0 items-center gap-2">
        <h1 className="font-heading text-xl leading-none font-semibold">
          {t("configuration.settings.title")}
        </h1>
        <Badge variant="outline" className="text-[10px] font-bold tracking-wider uppercase">
          {t("configuration.settings.badge")}
        </Badge>
      </div>
      <div className="flex min-w-0 items-center justify-between gap-3">
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
      </div>
    </header>
  );
}

function LanguageSettingsPanel() {
  const t = useTranslations();

  return (
    <DashboardFormPanel
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
    </DashboardFormPanel>
  );
}
