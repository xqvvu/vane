import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { appSettingsQueryKeys } from "#/features/configuration/api/configuration.queries";
import { destinationQueryKeys } from "#/features/destinations/api/destination.queries";
import { routeQueryKeys } from "#/features/routes/api/route.queries";
import { sourceQueryKeys } from "#/features/sources/api/source.queries";
import {
  exportConfigurationJsonFn,
  exportConfigurationTomlFn,
  importConfigurationJsonFn,
  importConfigurationTomlFn,
} from "#/server/functions/configuration.functions";

export function useConfigurationMutations() {
  const queryClient = useQueryClient();
  const exportConfigurationJson = useServerFn(exportConfigurationJsonFn);
  const exportConfigurationToml = useServerFn(exportConfigurationTomlFn);
  const importConfigurationJson = useServerFn(importConfigurationJsonFn);
  const importConfigurationToml = useServerFn(importConfigurationTomlFn);

  return {
    exportConfigurationJson,
    exportConfigurationToml,
    importConfigurationJson,
    importConfigurationToml,
    invalidateConfiguration: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: appSettingsQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: sourceQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: destinationQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: routeQueryKeys.all }),
      ]),
  };
}
