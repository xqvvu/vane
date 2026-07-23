import { queryOptions } from "@tanstack/react-query";

import { getRequestLocaleFn } from "#/server/functions/i18n.functions";

export const i18nQueryKeys = {
  all: ["i18n"] as const,
  requestLocale: () => [...i18nQueryKeys.all, "request-locale"] as const,
};

export function requestLocaleQueryOptions() {
  return queryOptions({
    queryKey: i18nQueryKeys.requestLocale(),
    queryFn: () => getRequestLocaleFn(),
  });
}
