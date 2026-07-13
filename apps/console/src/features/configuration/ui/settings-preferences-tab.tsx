import { Settings } from "reicon-react";

import type { AppSettings, DestinationSummary, RouteDefinition, SourceSummary } from "@vane/core";

import { ContentPanel } from "#/components/common/content-panel.tsx";
import { TabsContent } from "#/components/ui/tabs.tsx";
import { AppSettingsForm } from "#/features/configuration/ui/app-settings-form.tsx";
import { OperationalSummary } from "#/features/configuration/ui/operational-summary.tsx";
import { SettingsLanguageSetting } from "#/features/configuration/ui/settings-language-setting.tsx";
import { useTranslations } from "#/i18n/use-i18n.ts";

export function SettingsPreferencesTab({
  settings,
  sources,
  destinations,
  routes,
  pending,
  onSubmit,
}: {
  settings: AppSettings;
  sources: SourceSummary[];
  destinations: DestinationSummary[];
  routes: RouteDefinition[];
  pending: boolean;
  onSubmit: (input: AppSettings) => void;
}) {
  const t = useTranslations();

  return (
    <TabsContent value="ui" className="flex flex-col gap-4">
      <OperationalSummary
        sources={sources}
        destinations={destinations}
        routes={routes}
        retentionDays={settings.rawPayloadRetentionDays}
      />
      <ContentPanel
        title={t("configuration.preferences.title")}
        icon={<Settings className="size-4" aria-hidden />}
      >
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
          <AppSettingsForm settings={settings} pending={pending} onSubmit={onSubmit} />
          <SettingsLanguageSetting />
        </div>
      </ContentPanel>
    </TabsContent>
  );
}
