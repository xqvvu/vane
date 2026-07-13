import "@tanstack/react-start/client-only";
import { Globe } from "reicon-react";

import { DropdownMenuGroup, DropdownMenuLabel } from "#/components/ui/dropdown-menu.tsx";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select.tsx";
import { ToggleGroup, ToggleGroupItem } from "#/components/ui/toggle-group.tsx";
import { writeLocaleCookie } from "#/i18n/locale-cookie.ts";
import {
  isAppLocale,
  localeDisplayName,
  supportedLocales,
  type AppLocale,
} from "#/i18n/locales.ts";
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
        <Globe data-icon="inline-start" aria-hidden />
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
      <div className="px-2 pb-2">
        <ToggleGroup
          aria-label={t("locale.label")}
          className="border-input bg-muted/40 grid w-full grid-cols-2 border p-0.5"
          spacing={0}
          value={[locale]}
          onValueChange={(value) => {
            const [nextLocale] = value;

            if (nextLocale && isAppLocale(nextLocale) && nextLocale !== locale) {
              setLocale(nextLocale);
            }
          }}
        >
          {supportedLocales.map((availableLocale) => (
            <ToggleGroupItem
              key={availableLocale}
              value={availableLocale}
              className="aria-pressed:bg-background aria-pressed:text-foreground data-pressed:bg-background data-pressed:text-foreground h-7 min-w-0 px-2 aria-pressed:shadow-xs data-pressed:shadow-xs"
            >
              {localeDisplayName(availableLocale)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
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
