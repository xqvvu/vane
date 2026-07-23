import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import type { AppSettings } from "@vane/core";

import { appSettingsQueryKeys } from "#/features/configuration/api/configuration.queries";
import { i18nQueryKeys } from "#/i18n/i18n.queries";
import { updateAppSettingsFn } from "#/server/functions/configuration.functions";

export function useAppSettingsMutation() {
  const queryClient = useQueryClient();
  const updateAppSettings = useServerFn(updateAppSettingsFn);

  return useMutation({
    mutationFn: (input: AppSettings) => updateAppSettings({ data: input }),
    onSuccess: async (settings) => {
      queryClient.setQueryData(appSettingsQueryKeys.detail(), settings);
      await queryClient.invalidateQueries({ queryKey: i18nQueryKeys.all });
    },
  });
}
