import { useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { ContentPanel } from "#/components/common/content-panel.tsx";
import { appSettingsQueryOptions } from "#/features/configuration/api/configuration.queries.ts";
import { useAppSettingsMutation } from "#/features/configuration/api/use-app-settings-mutation.ts";
import { AppSettingsForm } from "#/features/configuration/ui/app-settings-form.tsx";
import { writeLocaleCookie } from "#/i18n/locale-cookie.ts";
import { useTranslations } from "#/i18n/use-i18n.ts";
import { hardReloadPage } from "#/lib/browser.ts";

export function SettingsPreferencesPanel() {
  const t = useTranslations();
  const { data: settings } = useSuspenseQuery(appSettingsQueryOptions());
  const mutation = useAppSettingsMutation();

  return (
    <ContentPanel title={t("configuration.preferences.title")}>
      <AppSettingsForm
        key={`${settings.locale}:${settings.timeZone}:${settings.rawPayloadRetentionDays}`}
        settings={settings}
        pending={mutation.isPending}
        onSubmit={async (input) => {
          try {
            const updated = await mutation.mutateAsync(input);
            writeLocaleCookie(updated.locale);
            hardReloadPage();
          } catch (error) {
            toast.error(t("configuration.settings.operationFailed"), {
              description: error instanceof Error ? error.message : String(error),
            });
          }
        }}
      />
    </ContentPanel>
  );
}
