import { queryOptions } from "@tanstack/react-query";

import { getAppSettingsFn } from "#/server/functions/configuration.functions.ts";

export const appSettingsQueryKeys = {
  all: ["app-settings"] as const,
  detail: () => [...appSettingsQueryKeys.all, "detail"] as const,
};

export function appSettingsQueryOptions() {
  return queryOptions({
    queryKey: appSettingsQueryKeys.detail(),
    queryFn: () => getAppSettingsFn(),
  });
}
