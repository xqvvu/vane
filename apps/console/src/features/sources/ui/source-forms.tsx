import { RiAddLine, RiEditLine, RiWebhookLine } from "@remixicon/react";
import { useForm } from "@tanstack/react-form";
import type { JsonObject } from "@vane/core";
import * as React from "react";

import { DashboardFormPanel } from "#/app/shell/dashboard-panel.tsx";
import { FormTextField } from "#/app/shell/form-text-field.tsx";
import { Button } from "#/components/ui/button.tsx";
import { Field as UiField, FieldError, FieldGroup, FieldLabel } from "#/components/ui/field.tsx";
import { Input } from "#/components/ui/input.tsx";
import { NativeSelect, NativeSelectOption } from "#/components/ui/native-select.tsx";
import type { Configuration } from "#/features/configuration/model/configuration-types.ts";
import {
  sourceConfigFromForm,
  sourceConfigPatchFromForm,
} from "#/features/sources/model/source-form.ts";

export function CreateSourceForm({
  pending,
  onSubmit,
}: {
  pending: boolean;
  onSubmit: (input: {
    name: string;
    provider: Configuration["sources"][number]["provider"];
    config?: JsonObject;
  }) => void;
}) {
  return (
    <DashboardFormPanel title="New source" icon={<RiWebhookLine className="size-4" aria-hidden />}>
      <SourceForm
        defaultValues={{
          name: "",
          provider: "generic",
        }}
        pending={pending}
        submitLabel="Create source"
        submitIcon={<RiAddLine aria-hidden />}
        onSubmit={onSubmit}
      />
    </DashboardFormPanel>
  );
}

export function EditSourceForm({
  source,
  pending,
  onCancel,
  onSubmit,
}: {
  source: Configuration["sources"][number];
  pending: boolean;
  onCancel: () => void;
  onSubmit: (input: {
    id: string;
    name: string;
    provider: Configuration["sources"][number]["provider"];
    config?: JsonObject;
  }) => void;
}) {
  return (
    <section className="border-border mt-3 border-t pt-3">
      <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold">
        <RiEditLine className="size-3.5" aria-hidden />
        Edit source
      </h3>
      <SourceForm
        defaultValues={{
          name: source.name,
          provider: source.provider,
        }}
        pending={pending}
        submitLabel="Save source"
        submitIcon={<RiEditLine aria-hidden />}
        onSubmit={(values) =>
          onSubmit({
            id: source.id,
            ...values,
          })
        }
        onCancel={onCancel}
      />
    </section>
  );
}

type SourceFormValues = {
  name: string;
  provider: Configuration["sources"][number]["provider"];
};

function SourceForm({
  defaultValues,
  pending,
  submitLabel,
  submitIcon,
  onSubmit,
  onCancel,
}: {
  defaultValues: SourceFormValues;
  pending: boolean;
  submitLabel: string;
  submitIcon: React.ReactNode;
  onSubmit: (input: SourceFormValues & { config?: JsonObject }) => void;
  onCancel?: () => void;
}) {
  const pendingConfig = React.useRef<JsonObject | undefined>(undefined);
  const form = useForm({
    defaultValues,
    onSubmit: ({ value }) => {
      const config = pendingConfig.current;

      onSubmit({
        name: value.name.trim(),
        provider: value.provider,
        ...(config ? { config } : {}),
      });
      pendingConfig.current = undefined;

      if (!onCancel) {
        form.reset();
      }
    },
  });

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        const data = new FormData(event.currentTarget);
        pendingConfig.current = onCancel
          ? sourceConfigPatchFromForm(data)
          : sourceConfigFromForm(data);
        void form.handleSubmit();
      }}
    >
      <FieldGroup className="gap-2">
        <form.Field
          name="name"
          validators={{
            onSubmit: ({ value }) => {
              return value.trim().length === 0 ? "Source name is required" : undefined;
            },
          }}
        >
          {(field) => (
            <UiField data-invalid={field.state.meta.errors.length > 0}>
              <FieldLabel htmlFor={field.name}>Name</FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                placeholder="Grafana prod"
                value={field.state.value}
                aria-invalid={field.state.meta.errors.length > 0}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.currentTarget.value)}
              />
              <FieldError
                errors={field.state.meta.errors.map((error) => ({
                  message: String(error),
                }))}
              />
            </UiField>
          )}
        </form.Field>
        <form.Field name="provider">
          {(field) => (
            <UiField>
              <FieldLabel htmlFor={field.name}>Provider</FieldLabel>
              <NativeSelect
                id={field.name}
                name={field.name}
                className="w-full"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) =>
                  field.handleChange(
                    event.currentTarget.value as Configuration["sources"][number]["provider"],
                  )
                }
              >
                <NativeSelectOption value="generic">Generic</NativeSelectOption>
                <NativeSelectOption value="grafana">Grafana</NativeSelectOption>
                <NativeSelectOption value="signoz">SigNoz</NativeSelectOption>
                <NativeSelectOption value="uptime_kuma">Uptime Kuma</NativeSelectOption>
                <NativeSelectOption value="alertmanager">Alertmanager</NativeSelectOption>
              </NativeSelect>
            </UiField>
          )}
        </form.Field>
      </FieldGroup>
      <FormTextField
        label={onCancel ? "Provider secret override" : "Provider secret"}
        name="signingSecret"
        type="password"
        placeholder={onCancel ? "Leave blank to keep current" : "optional shared secret"}
      />
      <div className={onCancel ? "grid grid-cols-2 gap-2" : undefined}>
        {onCancel ? (
          <Button type="button" variant="outline" size="sm" disabled={pending} onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" size="sm" disabled={pending} className={onCancel ? "" : "w-full"}>
          {submitIcon}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
