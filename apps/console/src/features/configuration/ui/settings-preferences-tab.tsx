import { TabsContent } from "#/components/ui/tabs.tsx";
import { SettingsOperationalOverview } from "#/features/configuration/ui/settings-operational-overview.tsx";
import { SettingsPreferencesPanel } from "#/features/configuration/ui/settings-preferences-panel.tsx";

export function SettingsPreferencesTab() {
  return (
    <TabsContent value="ui" className="flex flex-col gap-4">
      <SettingsOperationalOverview />
      <SettingsPreferencesPanel />
    </TabsContent>
  );
}
