import {
  RiDatabase2Line,
  RiErrorWarningLine,
  RiRefreshLine,
  RiShieldKeyholeLine,
} from "@remixicon/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import * as React from "react";

import { Alert, AlertDescription, AlertTitle } from "#/components/ui/alert.tsx";
import { Badge } from "#/components/ui/badge.tsx";
import { Button } from "#/components/ui/button.tsx";
import { useConfigurationMutations } from "#/features/configuration/api/configuration.mutations.ts";
import { configurationQueryOptions } from "#/features/configuration/api/configuration.queries.ts";
import type { ImportConfigurationResult } from "#/features/configuration/model/configuration-types.ts";
import { AppSettingsForm } from "#/features/configuration/ui/app-settings-form.tsx";
import { ImportNoticePanel } from "#/features/configuration/ui/import-notice-panel.tsx";
import { OperationalSummary } from "#/features/configuration/ui/operational-summary.tsx";
import { PortableConfigForm } from "#/features/configuration/ui/portable-config-form.tsx";
import { DashboardContentLayout } from "#/shell/dashboard-layout.tsx";
import { DashboardPanel } from "#/shell/dashboard-panel.tsx";
import { DashboardSidebar } from "#/shell/dashboard-sidebar.tsx";

export function SettingsPage() {
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
      variant="split"
      main={
        <>
          <SettingsPageToolbar pending={pending} onRefresh={() => void refreshConfiguration()} />
          {formError ? (
            <Alert variant="destructive" className="mx-3 mt-4">
              <RiErrorWarningLine aria-hidden />
              <AlertTitle>Settings operation failed</AlertTitle>
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          ) : null}
          {importNotice ? <ImportNoticePanel notice={importNotice} /> : null}
          <div className="flex flex-col gap-4 p-3">
            <OperationalSummary
              configuration={configuration}
              retentionDays={configuration.settings.rawPayloadRetentionDays}
            />
            <PortabilitySafetyPanel />
          </div>
        </>
      }
      sidebar={
        <DashboardSidebar variant="split">
          <AppSettingsForm
            settings={configuration.settings}
            pending={pending}
            onSubmit={(input) =>
              void submitAction("update-settings", () => updateAppSettings({ data: input }))
            }
          />
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
        </DashboardSidebar>
      }
    />
  );
}

function SettingsPageToolbar({ pending, onRefresh }: { pending: boolean; onRefresh: () => void }) {
  return (
    <header className="border-border bg-background flex flex-col gap-3 border-b px-3 py-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h1 className="font-heading text-2xl leading-none font-semibold">Settings</h1>
          <Badge variant="outline" className="text-[10px] font-bold tracking-wider uppercase">
            Configuration
          </Badge>
        </div>
        <p className="text-muted-foreground mt-2 text-sm">
          Manage raw payload retention, TOML portability, and secret-safe configuration transfer.
        </p>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={onRefresh}
        title="Refresh configuration"
        className="w-fit"
      >
        <RiRefreshLine data-icon="inline-start" aria-hidden />
        Refresh
      </Button>
    </header>
  );
}

function PortabilitySafetyPanel() {
  return (
    <DashboardPanel
      title="Portability and safety"
      icon={<RiShieldKeyholeLine className="size-4" aria-hidden />}
    >
      <div className="grid gap-3 md:grid-cols-2">
        <SafetyFact
          title="TOML integrity"
          description="Vane-owned configuration imports and exports use TOML for reviewable, self-hosted config-as-code workflows."
        />
        <SafetyFact
          title="Secret-safe exports"
          description="Exports request secrets omitted by default. Secret references can be resolved from environment variables during import."
        />
        <SafetyFact
          title="Validated imports"
          description="TOML is parsed and validated before stored Sources, Routes, Destinations, or settings are changed."
        />
        <SafetyFact
          title="One-time source tokens"
          description="New Sources created during import may return source tokens once; token hashes are never displayed."
        />
      </div>
    </DashboardPanel>
  );
}

function SafetyFact({ title, description }: { title: string; description: string }) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-2 text-xs font-medium">
        <RiDatabase2Line className="size-3.5" aria-hidden />
        {title}
      </div>
      <p className="text-muted-foreground mt-1 text-xs leading-5">{description}</p>
    </div>
  );
}
