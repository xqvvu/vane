import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";

import { readLocaleCookie } from "#/i18n/locale-cookie.ts";
import { resolveLocale } from "#/i18n/locales.ts";

export const getRequestLocaleFn = createServerFn({ method: "GET" }).handler(async () => {
  const headers = new Headers(getRequestHeaders());

  return {
    locale: resolveLocale({
      cookieLocale: readLocaleCookie(headers.get("cookie")),
      acceptLanguage: headers.get("accept-language"),
    }),
  };
});
