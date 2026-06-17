import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { configurationQueryKeys } from "#/features/configuration/api/configuration.queries.ts";
import {
  exportConfigurationTomlFn,
  importConfigurationTomlFn,
  updateAppSettingsFn,
} from "#/server/functions/configuration.functions.ts";

export function useConfigurationMutations() {
  const queryClient = useQueryClient();
  const exportConfigurationToml = useServerFn(exportConfigurationTomlFn);
  const importConfigurationToml = useServerFn(importConfigurationTomlFn);
  const updateAppSettings = useServerFn(updateAppSettingsFn);

  return {
    exportConfigurationToml,
    importConfigurationToml,
    updateAppSettings,
    invalidateConfiguration: () =>
      queryClient.invalidateQueries({
        queryKey: configurationQueryKeys.all,
      }),
  };
}
