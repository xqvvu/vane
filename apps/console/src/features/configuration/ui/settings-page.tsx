import { Tabs, TabsContent } from "#/components/ui/tabs.tsx";
import { ImportNoticePanel } from "#/features/configuration/ui/import-notice-panel.tsx";
import { PortableConfigForm } from "#/features/configuration/ui/portable-config-form.tsx";
import { SettingsPageToolbar } from "#/features/configuration/ui/settings-page-toolbar.tsx";
import { SettingsPreferencesTab } from "#/features/configuration/ui/settings-preferences-tab.tsx";
import { useSettingsWorkspace } from "#/features/configuration/ui/use-settings-workspace.ts";
import { DashboardContentLayout } from "#/shell/dashboard-layout.tsx";

export function SettingsPage() {
  const workspace = useSettingsWorkspace();

  return (
    <DashboardContentLayout
      main={
        <Tabs
          value={workspace.activeTab}
          onValueChange={workspace.setActiveTab}
          className="min-h-0 grow gap-4"
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
          <SettingsPreferencesTab />
          <TabsContent value="toml" className="min-h-0">
            {workspace.activeTab === "toml" ? (
              <PortableConfigForm
                format="toml"
                pending={workspace.pending}
                {...workspace.portable.toml}
              />
            ) : null}
          </TabsContent>
          <TabsContent value="json" className="min-h-0">
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
