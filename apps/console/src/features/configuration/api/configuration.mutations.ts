import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { appSettingsQueryKeys } from "#/features/configuration/api/configuration.queries.ts";
import { destinationQueryKeys } from "#/features/destinations/api/destination.queries.ts";
import { routeQueryKeys } from "#/features/routes/api/route.queries.ts";
import { sourceQueryKeys } from "#/features/sources/api/source.queries.ts";
import {
  exportConfigurationJsonFn,
  exportConfigurationTomlFn,
  importConfigurationJsonFn,
  importConfigurationTomlFn,
  updateAppSettingsFn,
} from "#/server/functions/configuration.functions.ts";

export function useConfigurationMutations() {
  const queryClient = useQueryClient();
  const exportConfigurationJson = useServerFn(exportConfigurationJsonFn);
  const exportConfigurationToml = useServerFn(exportConfigurationTomlFn);
  const importConfigurationJson = useServerFn(importConfigurationJsonFn);
  const importConfigurationToml = useServerFn(importConfigurationTomlFn);
  const updateAppSettings = useServerFn(updateAppSettingsFn);

  return {
    exportConfigurationJson,
    exportConfigurationToml,
    importConfigurationJson,
    importConfigurationToml,
    updateAppSettings,
    invalidateConfiguration: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: appSettingsQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: sourceQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: destinationQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: routeQueryKeys.all }),
      ]),
  };
}
