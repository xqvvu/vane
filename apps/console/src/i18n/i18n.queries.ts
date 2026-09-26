import { orpc } from "#/lib/orpc";

export const i18nQueryKeys = {
  all: ["i18n"] as const,
  requestLocale: () => [...i18nQueryKeys.all, "request-locale"] as const,
};

export function requestLocaleQueryOptions() {
  return orpc.i18n.getRequestLocale.queryOptions({
    queryKey: i18nQueryKeys.requestLocale(),
  });
}
