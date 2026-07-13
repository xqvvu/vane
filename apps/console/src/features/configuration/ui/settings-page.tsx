import { useSuspenseQueries } from "@tanstack/react-query";

import { Tabs, TabsContent } from "#/components/ui/tabs.tsx";
import { appSettingsQueryOptions } from "#/features/configuration/api/configuration.queries.ts";
import { ImportNoticePanel } from "#/features/configuration/ui/import-notice-panel.tsx";
import { PortableConfigForm } from "#/features/configuration/ui/portable-config-form.tsx";
import { SettingsPageToolbar } from "#/features/configuration/ui/settings-page-toolbar.tsx";
import { SettingsPreferencesTab } from "#/features/configuration/ui/settings-preferences-tab.tsx";
import { useSettingsWorkspace } from "#/features/configuration/ui/use-settings-workspace.ts";
import { destinationsQueryOptions } from "#/features/destinations/api/destination.queries.ts";
import { routesQueryOptions } from "#/features/routes/api/route.queries.ts";
import { sourcesQueryOptions } from "#/features/sources/api/source.queries.ts";
import { DashboardContentLayout } from "#/shell/dashboard-layout.tsx";

export function SettingsPage() {
  const [{ data: settings }, { data: sources }, { data: destinations }, { data: routes }] =
    useSuspenseQueries({
      queries: [
        appSettingsQueryOptions(),
        sourcesQueryOptions(),
        destinationsQueryOptions(),
        routesQueryOptions(),
      ],
    });
  const workspace = useSettingsWorkspace();

  return (
    <DashboardContentLayout
      main={
        <Tabs
          value={workspace.activeTab}
          onValueChange={workspace.setActiveTab}
          className="grow gap-4"
        >
          <SettingsPageToolbar
            pending={workspace.pending}
            onRefresh={() => void workspace.refresh()}
          />
          {workspace.importNotice ? (
            <div className="min-h-0">
              <ImportNoticePanel notice={workspace.importNotice} />
            </div>
          ) : null}
          <SettingsPreferencesTab
            settings={settings}
            sources={sources}
            destinations={destinations}
            routes={routes}
            pending={workspace.pending}
            onSubmit={workspace.updateSettings}
          />
          <TabsContent value="toml">
            {workspace.activeTab === "toml" ? (
              <PortableConfigForm
                format="toml"
                pending={workspace.pending}
                {...workspace.portable.toml}
              />
            ) : null}
          </TabsContent>
          <TabsContent value="json">
            {workspace.activeTab === "json" ? (
              <PortableConfigForm
                format="json"
                pending={workspace.pending}
                {...workspace.portable.json}
              />
            ) : null}
          </TabsContent>
        </Tabs>
      }
    />
  );
}
