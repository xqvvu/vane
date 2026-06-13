import "@tanstack/react-start/client-only";
import { RiGlobalLine } from "@remixicon/react";

import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
} from "#/components/ui/dropdown-menu.tsx";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select.tsx";
import { writeLocaleCookie } from "#/i18n/locale-cookie.ts";
import { localeDisplayName, supportedLocales, type AppLocale } from "#/i18n/locales.ts";
import { useLocale, useTranslations } from "#/i18n/use-i18n.ts";
import { hardReloadPage } from "#/lib/browser.ts";

export function LanguageSelectClient() {
  const locale = useCurrentAppLocale();
  const t = useTranslations();

  return (
    <Select
      items={supportedLocales.map((availableLocale) => ({
        value: availableLocale,
        label: localeDisplayName(availableLocale),
      }))}
      value={locale}
      onValueChange={(value) => {
        setLocale(value as AppLocale);
      }}
    >
      <SelectTrigger size="sm" aria-label={t("locale.label")} className="bg-background">
        <RiGlobalLine data-icon="inline-start" aria-hidden />
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        <SelectGroup>
          {supportedLocales.map((availableLocale) => (
            <SelectItem key={availableLocale} value={availableLocale}>
              {localeDisplayName(availableLocale)}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

export function LanguageMenuGroupClient() {
  const locale = useCurrentAppLocale();
  const t = useTranslations();

  return (
    <DropdownMenuGroup>
      <DropdownMenuLabel>{t("locale.label")}</DropdownMenuLabel>
      {supportedLocales.map((availableLocale) => (
        <DropdownMenuItem
          key={availableLocale}
          onClick={() => setLocale(availableLocale)}
          disabled={availableLocale === locale}
        >
          <RiGlobalLine aria-hidden />
          {localeDisplayName(availableLocale)}
        </DropdownMenuItem>
      ))}
    </DropdownMenuGroup>
  );
}

function useCurrentAppLocale(): AppLocale {
  return useLocale() as AppLocale;
}

function setLocale(locale: AppLocale): void {
  writeLocaleCookie(locale);
  hardReloadPage();
}
