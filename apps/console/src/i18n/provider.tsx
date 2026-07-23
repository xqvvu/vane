import * as React from "react";
import { IntlProvider } from "use-intl";

import type { AppLocale } from "#/i18n/locales";
import { getMessages } from "#/i18n/messages";
import { fallbackTimeZone } from "#/i18n/time-zone";

export interface VaneIntlProviderProps {
  children: React.ReactNode;
  locale: AppLocale;
  timeZone?: string;
}

export function VaneIntlProvider({
  children,
  locale,
  timeZone = fallbackTimeZone,
}: VaneIntlProviderProps) {
  return (
    <IntlProvider locale={locale} messages={getMessages(locale)} timeZone={timeZone}>
      {children}
    </IntlProvider>
  );
}
