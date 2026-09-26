import { readLocaleCookie } from "#/i18n/locale-cookie";
import { resolveLocale } from "#/i18n/locales";
import { os } from "#/server/orpc/os";
import { getApplicationContainer } from "#/server/runtime/container";

/**
 * Public locale probe.
 *
 * Reads the locale cookie, then `Accept-Language`, then the stored app settings
 * default, and reports the time zone the operator configured.
 */
export const i18nRouter = os.i18n.router({
  getRequestLocale: os.i18n.getRequestLocale.handler(async ({ context }) => {
    const headers = new Headers(context.reqHeaders);
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
  }),
});
