import * as React from "react";
import { IntlProvider } from "use-intl";

import type { AppLocale } from "#/i18n/locales.ts";
import { getMessages } from "#/i18n/messages.ts";
import { detectRuntimeTimeZone, fallbackTimeZone } from "#/i18n/time-zone.ts";

export interface VaneIntlProviderProps {
  children: React.ReactNode;
  locale: AppLocale;
}

export function VaneIntlProvider({ children, locale }: VaneIntlProviderProps) {
  const [timeZone, setTimeZone] = React.useState(fallbackTimeZone);

  React.useEffect(() => {
    setTimeZone(detectRuntimeTimeZone());
  }, []);

  return (
    <IntlProvider locale={locale} messages={getMessages(locale)} timeZone={timeZone}>
      {children}
    </IntlProvider>
  );
}
