import { RiDatabase2Line } from "@remixicon/react";
import { useForm } from "@tanstack/react-form";

import { DashboardFormPanel } from "#/app/shell/dashboard-panel.tsx";
import { Button } from "#/components/ui/button.tsx";
import { Field as UiField, FieldError, FieldGroup, FieldLabel } from "#/components/ui/field.tsx";
import { Input } from "#/components/ui/input.tsx";
import type { Configuration } from "#/features/configuration/model/configuration-types.ts";

export function AppSettingsForm({
  settings,
  pending,
  onSubmit,
}: {
  settings: Configuration["settings"];
  pending: boolean;
  onSubmit: (input: { rawPayloadRetentionDays: number }) => void;
}) {
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
      title="App settings"
      icon={<RiDatabase2Line className="size-4" aria-hidden />}
    >
      <form
        className="flex flex-col gap-2"
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
                  : "Retention must be between 0 and 3650 days";
              },
            }}
          >
            {(field) => (
              <UiField data-invalid={field.state.meta.errors.length > 0}>
                <FieldLabel htmlFor={field.name}>Raw payload retention days</FieldLabel>
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
          Save settings
        </Button>
      </form>
    </DashboardFormPanel>
  );
}
