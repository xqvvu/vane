import { ClientOnly } from "@tanstack/react-router";
import * as React from "react";

import { LanguageSelector } from "#/i18n/language-switcher.tsx";
import { useTranslations } from "#/i18n/use-i18n.ts";

export function SettingsLanguageSetting() {
  const t = useTranslations();

  return (
    <section className="border-border flex min-w-0 flex-col gap-2 border-t pt-4 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-5">
      <h3 className="text-xs font-medium">{t("configuration.settings.languageTitle")}</h3>
      <p className="text-muted-foreground text-xs leading-5">
        {t("configuration.settings.languageDescription")}
      </p>
      <ClientOnly fallback={<LanguageSelector.Skeleton />}>
        <React.Suspense fallback={<LanguageSelector.Skeleton />}>
          <LanguageSelector />
        </React.Suspense>
      </ClientOnly>
    </section>
  );
}
