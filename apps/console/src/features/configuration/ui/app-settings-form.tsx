import { useForm } from "@tanstack/react-form";
import { Save22 } from "reicon-react";

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
import { useTranslations } from "#/i18n/use-i18n.ts";

export function AppSettingsForm({
  settings,
  pending,
  onSubmit,
}: {
  settings: AppSettings;
  pending: boolean;
  onSubmit: (input: { rawPayloadRetentionDays: number }) => void;
}) {
  const t = useTranslations();

  const form = useForm({
    defaultValues: {
      rawPayloadRetentionDays: settings.rawPayloadRetentionDays,
    },
    onSubmit: ({ value }) => {
      onSubmit({
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
            <Save22 data-icon="inline-start" aria-hidden />
            {t("common.actions.saveSettings")}
          </Button>
        </footer>
      </FieldGroup>
    </form>
  );
}
