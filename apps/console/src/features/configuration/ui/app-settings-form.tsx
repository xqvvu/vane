import { RiDatabase2Line, RiSave3Line } from "@remixicon/react";
import { useForm } from "@tanstack/react-form";

import { Button } from "#/components/ui/button.tsx";
import {
  Field as UiField,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "#/components/ui/field.tsx";
import { Input } from "#/components/ui/input.tsx";
import type { Configuration } from "#/features/configuration/model/configuration-types.ts";
import { useTranslations } from "#/i18n/use-i18n.ts";
import { DashboardFormPanel } from "#/shell/dashboard-panel.tsx";

export function AppSettingsForm({
  settings,
  pending,
  onSubmit,
}: {
  settings: Configuration["settings"];
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
    <DashboardFormPanel
      title={t("configuration.appSettings.title")}
      icon={<RiDatabase2Line className="size-4" aria-hidden />}
    >
      <p className="text-muted-foreground mb-3 text-xs leading-5">
        {t("configuration.appSettings.description")}
      </p>
      <form
        className="flex flex-col gap-3"
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
                <Input
                  id={field.name}
                  name={field.name}
                  type="number"
                  min={0}
                  max={3650}
                  required
                  value={String(field.state.value)}
                  aria-invalid={field.state.meta.errors.length > 0}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.currentTarget.valueAsNumber)}
                />
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
        </FieldGroup>
        <Button type="submit" size="sm" disabled={pending} className="w-full">
          <RiSave3Line data-icon="inline-start" aria-hidden />
          {t("common.actions.saveSettings")}
        </Button>
      </form>
    </DashboardFormPanel>
  );
}
