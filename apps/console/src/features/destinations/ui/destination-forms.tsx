import { RiAddLine, RiArrowRightLine, RiEditLine, RiEyeLine } from "@remixicon/react";
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select.tsx";
import { Textarea } from "#/components/ui/textarea.tsx";
import type { Configuration } from "#/features/configuration/model/configuration-types.ts";
import {
  destinationConfigPatchFromForm,
  destinationConfigFromForm,
  type DestinationFormKind,
} from "#/features/destinations/model/destination-form.ts";
import { cn } from "#/lib/utils.ts";
import { DashboardFormPanel } from "#/shell/dashboard-panel.tsx";

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
      <p className="text-muted-foreground mb-3 text-xs leading-5">
        Configure one outbound adapter. Secret-bearing values stay server-side and are not shown
        again after save.
      </p>
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
    <section className="border-border bg-muted/30 mt-3 border p-3">
      <div className="mb-3">
        <h3 className="flex items-center gap-2 text-xs font-semibold">
          <RiEditLine className="size-3.5" aria-hidden />
          Edit destination
        </h3>
        <p className="text-muted-foreground mt-1 text-xs">
          Leave secret fields blank to keep existing values.
        </p>
      </div>
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
  const secretFieldDescription =
    mode === "create"
      ? "Stored server-side and omitted from configuration query data."
      : "Leave blank to keep the current stored value.";
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
    description,
  }: {
    label: string;
    name: keyof DestinationFormValues;
    type?: string;
    placeholder?: string;
    required?: boolean;
    description?: string;
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
          {description ? <FieldDescription>{description}</FieldDescription> : null}
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
    description,
  }: {
    label: string;
    name: keyof DestinationFormValues;
    id: string;
    className: string;
    placeholder: string;
    required?: boolean;
    description?: string;
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
          {description ? <FieldDescription>{description}</FieldDescription> : null}
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
      description: "One Name: value header per line. Values stay server-side.",
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
            description: secretFieldDescription,
          })}
          {renderTextareaField({
            label: "To",
            name: "to",
            id: "email-to",
            className: "min-h-16 resize-y font-mono text-[11px]",
            placeholder: "sre@example.com, audit@example.com",
            required: requiresSecrets,
            description: "Comma-separated or newline-separated delivery recipients.",
          })}
          {renderTextField({
            label: "From",
            name: "from",
            type: "email",
            placeholder: "vane@example.com",
            required: requiresSecrets,
            description: "Sender address used by the email gateway.",
          })}
          {renderTextField({
            label: "Reply-To",
            name: "replyTo",
            type: "email",
            placeholder: "ops@example.com",
            description: "Optional reply address for operator responses.",
          })}
          {renderTextField({
            label: "Subject prefix",
            name: "subjectPrefix",
            placeholder: "[Vane]",
            description: "Prepended to rendered email subjects.",
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
            description: secretFieldDescription,
          })}
          {kind === "generic_webhook" ? (
            <>
              <form.Field name="method">
                {(field) => (
                  <UiField>
                    <FieldLabel htmlFor={field.name}>Method</FieldLabel>
                    <Select
                      id={field.name}
                      name={field.name}
                      items={mode === "edit" ? webhookMethodEditItems : webhookMethodCreateItems}
                      value={field.state.value || null}
                      onValueChange={(value) => field.handleChange(value ?? "")}
                    >
                      <SelectTrigger className="w-full" onBlur={field.handleBlur}>
                        <SelectValue placeholder="Keep existing" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {mode === "edit" ? (
                            <SelectItem value={null}>Keep existing</SelectItem>
                          ) : null}
                          <SelectItem value="POST">POST</SelectItem>
                          <SelectItem value="PUT">PUT</SelectItem>
                          <SelectItem value="PATCH">PATCH</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FieldDescription>
                      HTTP method for generic webhook delivery attempts.
                    </FieldDescription>
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
                description: secretFieldDescription,
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
        description: "Deterministic interpolation only; templates do not execute code.",
      })}
    </>
  );

  return (
    <form
      className={mode === "create" ? "flex flex-col gap-3" : "grid gap-3"}
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <FieldGroup className={cn("gap-3", mode === "edit" ? "md:grid md:grid-cols-2" : "")}>
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
              <FieldDescription>Short label shown in routes and delivery history.</FieldDescription>
            </UiField>
          )}
        </form.Field>
        {mode === "create" ? (
          <form.Field name="kind">
            {(field) => (
              <UiField>
                <FieldLabel htmlFor={field.name}>Kind</FieldLabel>
                <Select
                  id={field.name}
                  name={field.name}
                  items={destinationKindItems}
                  value={field.state.value}
                  onValueChange={(value) => field.handleChange(value as DestinationFormKind)}
                >
                  <SelectTrigger className="w-full" onBlur={field.handleBlur}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="generic_webhook">Generic webhook</SelectItem>
                      <SelectItem value="feishu">Feishu</SelectItem>
                      <SelectItem value="slack">Slack</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FieldDescription>
                  Adapter type determines the required delivery fields.
                </FieldDescription>
              </UiField>
            )}
          </form.Field>
        ) : (
          <form.Field name="kind">
            {(field) => (
              <UiField>
                <FieldLabel htmlFor={field.name}>Kind</FieldLabel>
                <Input id={field.name} value={field.state.value} readOnly aria-readonly />
                <FieldDescription>Adapter kind cannot be changed after creation.</FieldDescription>
              </UiField>
            )}
          </form.Field>
        )}
      </FieldGroup>
      <FieldGroup className="gap-3">
        <form.Subscribe selector={(state) => state.values.kind}>
          {(kind) => renderDestinationConfigFields(kind)}
        </form.Subscribe>
      </FieldGroup>
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
          <RiEyeLine data-icon="inline-start" aria-hidden />
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
          {mode === "create" ? (
            <RiAddLine data-icon="inline-start" aria-hidden />
          ) : (
            <RiEditLine data-icon="inline-start" aria-hidden />
          )}
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

const webhookMethodCreateItems = [
  { value: "POST", label: "POST" },
  { value: "PUT", label: "PUT" },
  { value: "PATCH", label: "PATCH" },
];

const webhookMethodEditItems = [
  { value: null, label: "Keep existing" },
  ...webhookMethodCreateItems,
];

const destinationKindItems = [
  { value: "generic_webhook", label: "Generic webhook" },
  { value: "feishu", label: "Feishu" },
  { value: "slack", label: "Slack" },
  { value: "email", label: "Email" },
];

function destinationValuesToFormData(values: DestinationFormValues): FormData {
  const data = new FormData();

  for (const [key, value] of Object.entries(values)) {
    data.set(key, value);
  }

  return data;
}
