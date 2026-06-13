import type { AppLocale } from "#/i18n/locales.ts";
import enUsMessages from "#/i18n/messages/en-US.json";
import zhHansMessages from "#/i18n/messages/zh-Hans.json";

export type AppMessages = typeof enUsMessages;

export const messagesByLocale = {
  "en-US": enUsMessages,
  "zh-Hans": zhHansMessages,
} satisfies Record<AppLocale, AppMessages>;

export function getMessages(locale: AppLocale): AppMessages {
  return messagesByLocale[locale];
}
