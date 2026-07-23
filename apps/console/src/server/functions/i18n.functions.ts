import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";

import { readLocaleCookie } from "#/i18n/locale-cookie";
import { resolveLocale } from "#/i18n/locales";
import { getApplicationContainer } from "#/server/runtime/container";

export const getRequestLocaleFn = createServerFn({ method: "GET" }).handler(async () => {
  const headers = new Headers(getRequestHeaders());
  const settings = await (
    await getApplicationContainer().createAppSettingsService()
  ).getAppSettings();

  return {
    locale: resolveLocale({
      cookieLocale: readLocaleCookie(headers.get("cookie")) ?? settings.locale,
      acceptLanguage: headers.get("accept-language"),
    }),
    timeZone: settings.timeZone,
  };
});
