import { RiSave3Line } from "@remixicon/react";
import { useForm } from "@tanstack/react-form";

import type { AppSettings } from "@vane/core";

import { Button } from "#/components/ui/button.tsx";
import {
  Field as UiField,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "#/components/ui/field.tsx";
import { Input } from "#/components/ui/input.tsx";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select.tsx";
import { SettingsTimeZoneCombobox } from "#/features/configuration/ui/settings-time-zone-combobox.tsx";
import { localeDisplayName, supportedLocales, type AppLocale } from "#/i18n/locales.ts";
import { useTranslations } from "#/i18n/use-i18n.ts";

export function AppSettingsForm({
  settings,
  pending,
  onSubmit,
}: {
  settings: AppSettings;
  pending: boolean;
  onSubmit: (input: AppSettings) => Promise<void> | void;
}) {
  const t = useTranslations();

  const form = useForm({
    defaultValues: {
      locale: settings.locale,
      timeZone: settings.timeZone,
      rawPayloadRetentionDays: settings.rawPayloadRetentionDays,
    },
    onSubmit: ({ value }) => {
      return onSubmit({
        locale: value.locale,
        timeZone: value.timeZone,
        rawPayloadRetentionDays: Number(value.rawPayloadRetentionDays),
      });
    },
  });

  return (
    <form
      className="flex min-w-0 flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <FieldGroup className="gap-2">
        <FieldGroup className="grid gap-4 md:grid-cols-2">
          <form.Field name="locale">
            {(field) => (
              <UiField>
                <FieldLabel htmlFor={field.name}>
                  {t("configuration.appSettings.language")}
                </FieldLabel>
                <Select
                  items={supportedLocales.map((locale) => ({
                    value: locale,
                    label: localeDisplayName(locale),
                  }))}
                  value={field.state.value}
                  onValueChange={(value) => field.handleChange(value as AppLocale)}
                >
                  <SelectTrigger id={field.name} className="w-full" onBlur={field.handleBlur}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {supportedLocales.map((locale) => (
                        <SelectItem key={locale} value={locale}>
                          {localeDisplayName(locale)}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FieldDescription>
                  {t("configuration.appSettings.languageDescription")}
                </FieldDescription>
              </UiField>
            )}
          </form.Field>

          <form.Field
            name="timeZone"
            validators={{
              onSubmit: ({ value }) => {
                try {
                  new Intl.DateTimeFormat("en-US", { timeZone: value }).format();
                  return undefined;
                } catch {
                  return t("configuration.appSettings.timeZoneValidation");
                }
              },
            }}
          >
            {(field) => (
              <UiField data-invalid={field.state.meta.errors.length > 0}>
                <FieldLabel htmlFor={field.name}>
                  {t("configuration.appSettings.timeZone")}
                </FieldLabel>
                <SettingsTimeZoneCombobox
                  id={field.name}
                  invalid={field.state.meta.errors.length > 0}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={field.handleChange}
                />
                <FieldDescription>
                  {t("configuration.appSettings.timeZoneDescription")}
                </FieldDescription>
                <FieldError
                  errors={field.state.meta.errors.map((error) => ({ message: String(error) }))}
                />
              </UiField>
            )}
          </form.Field>
        </FieldGroup>

        <form.Field
          name="rawPayloadRetentionDays"
          validators={{
            onSubmit: ({ value }) => {
              return Number.isFinite(value) && value >= 0 && value <= 3650
                ? undefined
                : t("configuration.appSettings.rawPayloadRetentionValidation");
            },
          }}
        >
          {(field) => (
            <UiField data-invalid={field.state.meta.errors.length > 0}>
              <FieldLabel htmlFor={field.name}>
                {t("configuration.appSettings.rawPayloadRetentionDays")}
              </FieldLabel>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input
                  id={field.name}
                  name={field.name}
                  type="number"
                  min={0}
                  max={3650}
                  required
                  value={String(field.state.value)}
                  aria-invalid={field.state.meta.errors.length > 0}
                  className="sm:max-w-40"
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.currentTarget.valueAsNumber)}
                />
                <span className="text-muted-foreground text-xs sm:mr-auto">
                  {t("configuration.summary.days")}
                </span>
              </div>
              <FieldDescription>
                {t("configuration.appSettings.rawPayloadRetentionDescription")}
              </FieldDescription>
              <FieldError
                errors={field.state.meta.errors.map((error) => ({
                  message: String(error),
                }))}
              />
            </UiField>
          )}
        </form.Field>

        <footer>
          <Button type="submit" size="sm" disabled={pending} className="sm:shrink-0">
            <RiSave3Line data-icon="inline-start" aria-hidden />
            {t("common.actions.saveSettings")}
          </Button>
        </footer>
      </FieldGroup>
    </form>
  );
}
