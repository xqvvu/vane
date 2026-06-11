import { RiAddLine, RiArrowRightLine, RiEditLine, RiEyeLine } from "@remixicon/react";
import { useForm } from "@tanstack/react-form";
import type { JsonObject } from "@vane/core";
import * as React from "react";

import { DashboardFormPanel } from "#/app/shell/dashboard-panel.tsx";
import { Button } from "#/components/ui/button.tsx";
import { Field as UiField, FieldError, FieldLabel } from "#/components/ui/field.tsx";
import { Input } from "#/components/ui/input.tsx";
import { NativeSelect, NativeSelectOption } from "#/components/ui/native-select.tsx";
import { Textarea } from "#/components/ui/textarea.tsx";
import type { Configuration } from "#/features/configuration/model/configuration-types.ts";
import {
  destinationConfigPatchFromForm,
  destinationConfigFromForm,
  type DestinationFormKind,
} from "#/features/destinations/model/destination-form.ts";

export function CreateDestinationForm({
  pending,
  onPreview,
  onSubmit,
}: {
  pending: boolean;
  onPreview: (input: { name: string; kind: DestinationFormKind; config: JsonObject }) => void;
  onSubmit: (input: { name: string; kind: DestinationFormKind; config: JsonObject }) => void;
}) {
  return (
    <DashboardFormPanel
      title="New destination"
      icon={<RiArrowRightLine className="size-4" aria-hidden />}
    >
      <DestinationForm
        mode="create"
        pending={pending}
        defaultValues={createDestinationDefaults()}
        onPreview={onPreview}
        onSubmit={onSubmit}
      />
    </DashboardFormPanel>
  );
}

export function EditDestinationForm({
  destination,
  pending,
  onCancel,
  onPreview,
  onSubmit,
}: {
  destination: Configuration["destinations"][number];
  pending: boolean;
  onCancel: () => void;
  onPreview: (input: { name: string; kind: DestinationFormKind; config: JsonObject }) => void;
  onSubmit: (input: {
    id: string;
    name: string;
    kind: DestinationFormKind;
    config: JsonObject;
  }) => void;
}) {
  return (
    <section className="border-border mt-3 border-t pt-3">
      <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold">
        <RiEditLine className="size-3.5" aria-hidden />
        Edit destination
      </h3>
      <DestinationForm
        mode="edit"
        pending={pending}
        defaultValues={{
          ...createDestinationDefaults(),
          name: destination.name,
          kind: destination.kind,
          method: "",
        }}
        onCancel={onCancel}
        onPreview={(input) => onPreview(input)}
        onSubmit={(input) =>
          onSubmit({
            id: destination.id,
            ...input,
          })
        }
      />
    </section>
  );
}

type DestinationFormMode = "create" | "edit";

type DestinationFormValues = {
  name: string;
  kind: DestinationFormKind;
  endpointUrl: string;
  to: string;
  from: string;
  replyTo: string;
  subjectPrefix: string;
  headers: string;
  url: string;
  webhookUrl: string;
  method: string;
  signSecret: string;
  messageTemplate: string;
};

function DestinationForm({
  mode,
  pending,
  defaultValues,
  onPreview,
  onSubmit,
  onCancel,
}: {
  mode: DestinationFormMode;
  pending: boolean;
  defaultValues: DestinationFormValues;
  onPreview: (input: { name: string; kind: DestinationFormKind; config: JsonObject }) => void;
  onSubmit: (input: { name: string; kind: DestinationFormKind; config: JsonObject }) => void;
  onCancel?: () => void;
}) {
  const submitIntent = React.useRef<"preview" | "submit">("submit");
  const form = useForm({
    defaultValues,
    onSubmit: ({ value }) => {
      const selectedKind = value.kind;
      const data = destinationValuesToFormData(value);
      const input = {
        name: value.name,
        kind: selectedKind,
        config:
          mode === "create"
            ? destinationConfigFromForm(selectedKind, data)
            : destinationConfigPatchFromForm(selectedKind, data),
      };

      if (submitIntent.current === "preview") {
        onPreview(input);
        return;
      }

      onSubmit(input);

      if (mode === "create") {
        form.reset();
      }
    },
  });

  const requiresSecrets = mode === "create";

  const renderTextField = ({
    label,
    name,
    type = "text",
    placeholder,
    required,
  }: {
    label: string;
    name: keyof DestinationFormValues;
    type?: string;
    placeholder?: string;
    required?: boolean;
  }) => (
    <form.Field name={name}>
      {(field) => (
        <UiField>
          <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
          <Input
            id={field.name}
            name={field.name}
            type={type}
            placeholder={placeholder}
            required={required}
            value={String(field.state.value)}
            onBlur={field.handleBlur}
            onChange={(event) => field.handleChange(event.currentTarget.value)}
          />
        </UiField>
      )}
    </form.Field>
  );

  const renderTextareaField = ({
    label,
    name,
    id,
    className,
    placeholder,
    required,
  }: {
    label: string;
    name: keyof DestinationFormValues;
    id: string;
    className: string;
    placeholder: string;
    required?: boolean;
  }) => (
    <form.Field name={name}>
      {(field) => (
        <UiField>
          <FieldLabel htmlFor={id}>{label}</FieldLabel>
          <Textarea
            id={id}
            name={field.name}
            className={className}
            placeholder={placeholder}
            required={required}
            value={String(field.state.value)}
            onBlur={field.handleBlur}
            onChange={(event) => field.handleChange(event.currentTarget.value)}
          />
        </UiField>
      )}
    </form.Field>
  );

  const renderHeaderLinesField = () =>
    renderTextareaField({
      label: "Headers",
      name: "headers",
      id: "headers",
      className: "min-h-16 resize-y font-mono text-[11px]",
      placeholder: "Authorization: Bearer ...",
    });

  const renderDestinationConfigFields = (kind: DestinationFormKind) => (
    <>
      {kind === "email" ? (
        <>
          {renderTextField({
            label: "Email gateway URL",
            name: "endpointUrl",
            type: "url",
            placeholder: "https://mail-gateway.example/send",
            required: requiresSecrets,
          })}
          {renderTextareaField({
            label: "To",
            name: "to",
            id: "email-to",
            className: "min-h-16 resize-y font-mono text-[11px]",
            placeholder: "sre@example.com, audit@example.com",
            required: requiresSecrets,
          })}
          {renderTextField({
            label: "From",
            name: "from",
            type: "email",
            placeholder: "vane@example.com",
            required: requiresSecrets,
          })}
          {renderTextField({
            label: "Reply-To",
            name: "replyTo",
            type: "email",
            placeholder: "ops@example.com",
          })}
          {renderTextField({
            label: "Subject prefix",
            name: "subjectPrefix",
            placeholder: "[Vane]",
          })}
          {renderHeaderLinesField()}
        </>
      ) : (
        <>
          {renderTextField({
            label:
              kind === "slack"
                ? "Slack webhook URL"
                : kind === "feishu"
                  ? "Feishu webhook URL"
                  : "Webhook URL",
            name: kind === "generic_webhook" ? "url" : "webhookUrl",
            type: "url",
            placeholder: "https://...",
            required: requiresSecrets,
          })}
          {kind === "generic_webhook" ? (
            <>
              <form.Field name="method">
                {(field) => (
                  <UiField>
                    <FieldLabel htmlFor={field.name}>Method</FieldLabel>
                    <NativeSelect
                      id={field.name}
                      name={field.name}
                      className="w-full"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.currentTarget.value)}
                    >
                      {mode === "edit" ? (
                        <NativeSelectOption value="">Keep existing</NativeSelectOption>
                      ) : null}
                      <NativeSelectOption value="POST">POST</NativeSelectOption>
                      <NativeSelectOption value="PUT">PUT</NativeSelectOption>
                      <NativeSelectOption value="PATCH">PATCH</NativeSelectOption>
                    </NativeSelect>
                  </UiField>
                )}
              </form.Field>
              {renderHeaderLinesField()}
            </>
          ) : null}
          {kind === "feishu"
            ? renderTextField({
                label: "Sign secret",
                name: "signSecret",
                placeholder: "optional",
              })
            : null}
        </>
      )}
      {renderTextareaField({
        label: "Message template",
        name: "messageTemplate",
        id: `message-template-${kind}`,
        className: "min-h-20 resize-y font-mono text-[11px]",
        placeholder: "{{event.title}} on {{source.name}}",
      })}
    </>
  );

  return (
    <form
      className={mode === "create" ? "flex flex-col gap-2" : "grid gap-2"}
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <div className={mode === "edit" ? "grid gap-2 md:grid-cols-2" : undefined}>
        <form.Field
          name="name"
          validators={{
            onSubmit: ({ value }) =>
              value.trim().length === 0 ? "Destination name is required" : undefined,
          }}
        >
          {(field) => (
            <UiField data-invalid={field.state.meta.errors.length > 0}>
              <FieldLabel htmlFor={field.name}>Name</FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                placeholder="Ops destination"
                value={field.state.value}
                required
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
        {mode === "create" ? (
          <form.Field name="kind">
            {(field) => (
              <UiField>
                <FieldLabel htmlFor={field.name}>Kind</FieldLabel>
                <NativeSelect
                  id={field.name}
                  name={field.name}
                  className="w-full"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) =>
                    field.handleChange(event.currentTarget.value as DestinationFormKind)
                  }
                >
                  <NativeSelectOption value="generic_webhook">Generic webhook</NativeSelectOption>
                  <NativeSelectOption value="feishu">Feishu</NativeSelectOption>
                  <NativeSelectOption value="slack">Slack</NativeSelectOption>
                  <NativeSelectOption value="email">Email</NativeSelectOption>
                </NativeSelect>
              </UiField>
            )}
          </form.Field>
        ) : (
          <form.Field name="kind">
            {(field) => (
              <UiField>
                <FieldLabel htmlFor={field.name}>Kind</FieldLabel>
                <Input id={field.name} value={field.state.value} readOnly aria-readonly />
              </UiField>
            )}
          </form.Field>
        )}
      </div>
      <form.Subscribe selector={(state) => state.values.kind}>
        {(kind) => renderDestinationConfigFields(kind)}
      </form.Subscribe>
      <div className={mode === "edit" ? "grid grid-cols-3 gap-2" : "grid grid-cols-2 gap-2"}>
        {mode === "edit" ? (
          <Button type="button" variant="outline" size="sm" disabled={pending} onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button
          type="submit"
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => {
            submitIntent.current = "preview";
          }}
        >
          <RiEyeLine aria-hidden />
          Preview
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={pending}
          onClick={() => {
            submitIntent.current = "submit";
          }}
        >
          {mode === "create" ? <RiAddLine aria-hidden /> : <RiEditLine aria-hidden />}
          {mode === "create" ? "Create destination" : "Save destination"}
        </Button>
      </div>
    </form>
  );
}

function createDestinationDefaults(): DestinationFormValues {
  return {
    name: "",
    kind: "generic_webhook",
    endpointUrl: "",
    to: "",
    from: "",
    replyTo: "",
    subjectPrefix: "",
    headers: "",
    url: "",
    webhookUrl: "",
    method: "POST",
    signSecret: "",
    messageTemplate: "",
  };
}

function destinationValuesToFormData(values: DestinationFormValues): FormData {
  const data = new FormData();

  for (const [key, value] of Object.entries(values)) {
    data.set(key, value);
  }

  return data;
}
