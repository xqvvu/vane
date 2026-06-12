import { RiAddCircleLine, RiAddLine, RiEditLine } from "@remixicon/react";
import { useForm } from "@tanstack/react-form";
import type { JsonObject } from "@vane/core";
import * as React from "react";

import { Button } from "#/components/ui/button.tsx";
import {
  Field as UiField,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "#/components/ui/field.tsx";
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
    <section>
      <div className="mb-6">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <RiAddCircleLine className="size-4" aria-hidden />
          New Source
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Configure a new inbound pipeline to ingest alerts.
        </p>
      </div>
      <SourceForm
        defaultValues={{
          name: "",
          provider: "generic",
        }}
        pending={pending}
        submitLabel="Create Source"
        submitIcon={<RiAddLine data-icon="inline-start" aria-hidden />}
        layout="rail"
        onSubmit={onSubmit}
      />
      <p className="text-muted-foreground mt-3 text-[11px] leading-relaxed">
        The source token is generated after create and shown once.
      </p>
    </section>
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
    <section className="border-border bg-muted/30 mt-3 border p-3">
      <h3 className="flex items-center gap-2 text-xs font-semibold">
        <RiEditLine className="size-3.5" aria-hidden />
        Edit source
      </h3>
      <p className="text-muted-foreground mt-1 mb-3 text-xs">
        Update the intake label, provider parser, or provider secret override for this source.
      </p>
      <SourceForm
        defaultValues={{
          name: source.name,
          provider: source.provider,
        }}
        pending={pending}
        submitLabel="Save source"
        submitIcon={<RiEditLine data-icon="inline-start" aria-hidden />}
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
  layout = "compact",
}: {
  defaultValues: SourceFormValues;
  pending: boolean;
  submitLabel: string;
  submitIcon: React.ReactNode;
  onSubmit: (input: SourceFormValues & { config?: JsonObject }) => void;
  onCancel?: () => void;
  layout?: "compact" | "rail";
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
      className={layout === "rail" ? "flex flex-col gap-5" : "flex flex-col gap-2"}
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
      <FieldGroup className={layout === "rail" ? "gap-5" : "gap-2"}>
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
              <FieldLabel className={labelClassName(layout)} htmlFor={field.name}>
                Name
              </FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                className={inputClassName(layout)}
                placeholder={layout === "rail" ? "e.g. Sentry Production" : "Production Grafana"}
                value={field.state.value}
                aria-invalid={field.state.meta.errors.length > 0}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.currentTarget.value)}
              />
              {layout === "compact" ? (
                <FieldDescription>
                  Use the upstream system name operators will recognize during triage.
                </FieldDescription>
              ) : null}
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
              <FieldLabel className={labelClassName(layout)} htmlFor={field.name}>
                Provider
              </FieldLabel>
              <NativeSelect
                id={field.name}
                name={field.name}
                className="w-full"
                selectClassName={inputClassName(layout)}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) =>
                  field.handleChange(
                    event.currentTarget.value as Configuration["sources"][number]["provider"],
                  )
                }
              >
                <NativeSelectOption value="generic">Generic Webhook</NativeSelectOption>
                <NativeSelectOption value="grafana">Grafana</NativeSelectOption>
                <NativeSelectOption value="signoz">SigNoz</NativeSelectOption>
                <NativeSelectOption value="uptime_kuma">Uptime Kuma</NativeSelectOption>
                <NativeSelectOption value="alertmanager">Alertmanager</NativeSelectOption>
              </NativeSelect>
              {layout === "compact" ? (
                <FieldDescription>
                  Provider parsers normalize inbound webhook payloads.
                </FieldDescription>
              ) : null}
            </UiField>
          )}
        </form.Field>
      </FieldGroup>
      <UiField>
        <FieldLabel
          className={labelClassName(layout)}
          htmlFor={onCancel ? "edit-signingSecret" : "create-signingSecret"}
        >
          {onCancel ? "Signing secret override" : "Signing secret"}
        </FieldLabel>
        <Input
          id={onCancel ? "edit-signingSecret" : "create-signingSecret"}
          name="signingSecret"
          type="password"
          className={inputClassName(layout)}
          placeholder={onCancel ? "Leave blank to keep current" : "Enter secret or leave blank"}
        />
        <FieldDescription>
          Stored server-side only. Leave blank when the provider does not sign payloads.
        </FieldDescription>
      </UiField>
      <div className={onCancel ? "grid grid-cols-2 gap-2" : undefined}>
        {onCancel ? (
          <Button type="button" variant="outline" size="sm" disabled={pending} onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button
          type="submit"
          size={layout === "rail" ? "lg" : "sm"}
          disabled={pending}
          className={onCancel ? "" : "w-full font-bold"}
        >
          {submitIcon}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

function labelClassName(layout: "compact" | "rail"): string | undefined {
  return layout === "rail"
    ? "text-muted-foreground text-[11px] font-semibold tracking-wider uppercase"
    : undefined;
}

function inputClassName(layout: "compact" | "rail"): string | undefined {
  return layout === "rail" ? "h-12 bg-background px-3 text-sm" : undefined;
}
