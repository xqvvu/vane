import { useSuspenseQuery } from "@tanstack/react-query";
import * as React from "react";

import { DashboardContentLayout } from "#/app/shell/dashboard-layout.tsx";
import { DashboardSidebar } from "#/app/shell/dashboard-sidebar.tsx";
import { useConfigurationMutations } from "#/features/configuration/api/configuration.mutations.ts";
import { configurationQueryOptions } from "#/features/configuration/api/configuration.queries.ts";
import type { ImportConfigurationResult } from "#/features/configuration/model/configuration-types.ts";
import { AppSettingsForm } from "#/features/configuration/ui/app-settings-form.tsx";
import { ImportNoticePanel } from "#/features/configuration/ui/import-notice-panel.tsx";
import { OperationalSummary } from "#/features/configuration/ui/operational-summary.tsx";
import { PortableConfigForm } from "#/features/configuration/ui/portable-config-form.tsx";

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
      main={
        <>
          {formError ? (
            <div className="border-destructive/40 bg-destructive/10 text-destructive border px-3 py-2 text-xs">
              {formError}
            </div>
          ) : null}
          {importNotice ? <ImportNoticePanel notice={importNotice} /> : null}
          <OperationalSummary configuration={configuration} />
        </>
      }
      sidebar={
        <DashboardSidebar>
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
