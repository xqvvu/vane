import type * as React from "react";
import { IntlProvider } from "use-intl";

import type { AppLocale } from "#/i18n/locales.ts";
import { getMessages } from "#/i18n/messages.ts";

export interface VaneIntlProviderProps {
  children: React.ReactNode;
  locale: AppLocale;
}

export function VaneIntlProvider({ children, locale }: VaneIntlProviderProps) {
  return (
    <IntlProvider locale={locale} messages={getMessages(locale)} timeZone="UTC">
      {children}
    </IntlProvider>
  );
}
