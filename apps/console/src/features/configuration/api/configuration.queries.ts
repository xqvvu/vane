import { orpc } from "#/lib/orpc";

export const appSettingsQueryKeys = {
  all: ["app-settings"] as const,
  detail: () => [...appSettingsQueryKeys.all, "detail"] as const,
};

export function appSettingsQueryOptions() {
  return orpc.settings.get.queryOptions({
    queryKey: appSettingsQueryKeys.detail(),
  });
}
