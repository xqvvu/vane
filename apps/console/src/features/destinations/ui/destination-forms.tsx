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
import { useTranslations } from "#/i18n/use-i18n.ts";
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
  const t = useTranslations();

  return (
    <DashboardFormPanel
      title={t("destinations.form.create.title")}
      icon={<RiArrowRightLine className="size-4" aria-hidden />}
    >
      <p className="text-muted-foreground mb-3 text-xs leading-5">
        {t("destinations.form.create.description")}
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
  const t = useTranslations();

  return (
    <section className="border-border bg-muted/30 mt-3 border p-3">
      <div className="mb-3">
        <h3 className="flex items-center gap-2 text-xs font-semibold">
          <RiEditLine className="size-3.5" aria-hidden />
          {t("destinations.form.edit.title")}
        </h3>
        <p className="text-muted-foreground mt-1 text-xs">
          {t("destinations.form.edit.description")}
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
  const t = useTranslations();

  const submitIntent = React.useRef<"preview" | "submit">("submit");
  const secretFieldDescription =
    mode === "create"
      ? t("destinations.form.secretDescriptionCreate")
      : t("destinations.form.secretDescriptionEdit");
  const destinationKindItems = [
    { value: "generic_webhook", label: t("destinations.kinds.generic_webhook") },
    { value: "feishu", label: t("destinations.kinds.feishu") },
    { value: "slack", label: t("destinations.kinds.slack") },
    { value: "email", label: t("destinations.kinds.email") },
  ];
  const webhookMethodEditItems = [
    { value: null, label: t("destinations.form.keepExisting") },
    ...webhookMethodCreateItems,
  ];
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
      label: t("destinations.form.headers"),
      name: "headers",
      id: "headers",
      className: "min-h-16 resize-y font-mono text-[11px]",
      placeholder: "Authorization: Bearer ...",
      description: t("destinations.form.headersDescription"),
    });

  const renderDestinationConfigFields = (kind: DestinationFormKind) => (
    <>
      {kind === "email" ? (
        <>
          {renderTextField({
            label: t("destinations.form.emailGatewayUrl"),
            name: "endpointUrl",
            type: "url",
            placeholder: "https://mail-gateway.example/send",
            required: requiresSecrets,
            description: secretFieldDescription,
          })}
          {renderTextareaField({
            label: t("destinations.form.to"),
            name: "to",
            id: "email-to",
            className: "min-h-16 resize-y font-mono text-[11px]",
            placeholder: "sre@example.com, audit@example.com",
            required: requiresSecrets,
            description: t("destinations.form.toDescription"),
          })}
          {renderTextField({
            label: t("destinations.form.from"),
            name: "from",
            type: "email",
            placeholder: "vane@example.com",
            required: requiresSecrets,
            description: t("destinations.form.fromDescription"),
          })}
          {renderTextField({
            label: t("destinations.form.replyTo"),
            name: "replyTo",
            type: "email",
            placeholder: "ops@example.com",
            description: t("destinations.form.replyToDescription"),
          })}
          {renderTextField({
            label: t("destinations.form.subjectPrefix"),
            name: "subjectPrefix",
            placeholder: "[Vane]",
            description: t("destinations.form.subjectPrefixDescription"),
          })}
          {renderHeaderLinesField()}
        </>
      ) : (
        <>
          {renderTextField({
            label:
              kind === "slack"
                ? t("destinations.form.slackWebhookUrl")
                : kind === "feishu"
                  ? t("destinations.form.feishuWebhookUrl")
                  : t("destinations.form.webhookUrl"),
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
                    <FieldLabel htmlFor={field.name}>{t("destinations.form.method")}</FieldLabel>
                    <Select
                      id={field.name}
                      name={field.name}
                      items={mode === "edit" ? webhookMethodEditItems : webhookMethodCreateItems}
                      value={field.state.value || null}
                      onValueChange={(value) => field.handleChange(value ?? "")}
                    >
                      <SelectTrigger className="w-full" onBlur={field.handleBlur}>
                        <SelectValue placeholder={t("destinations.form.keepExisting")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {mode === "edit" ? (
                            <SelectItem value={null}>
                              {t("destinations.form.keepExisting")}
                            </SelectItem>
                          ) : null}
                          <SelectItem value="POST">POST</SelectItem>
                          <SelectItem value="PUT">PUT</SelectItem>
                          <SelectItem value="PATCH">PATCH</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FieldDescription>{t("destinations.form.methodDescription")}</FieldDescription>
                  </UiField>
                )}
              </form.Field>
              {renderHeaderLinesField()}
            </>
          ) : null}
          {kind === "feishu"
            ? renderTextField({
                label: t("destinations.form.signSecret"),
                name: "signSecret",
                placeholder: t("destinations.form.optionalPlaceholder"),
                description: secretFieldDescription,
              })
            : null}
        </>
      )}
      {renderTextareaField({
        label: t("destinations.form.messageTemplate"),
        name: "messageTemplate",
        id: `message-template-${kind}`,
        className: "min-h-20 resize-y font-mono text-[11px]",
        placeholder: "{{event.title}} on {{source.name}}",
        description: t("destinations.form.messageTemplateDescription"),
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
              value.trim().length === 0
                ? t("destinations.form.validation.nameRequired")
                : undefined,
          }}
        >
          {(field) => (
            <UiField data-invalid={field.state.meta.errors.length > 0}>
              <FieldLabel htmlFor={field.name}>{t("destinations.form.nameLabel")}</FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                placeholder={t("destinations.form.namePlaceholder")}
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
              <FieldDescription>{t("destinations.form.nameDescription")}</FieldDescription>
            </UiField>
          )}
        </form.Field>
        {mode === "create" ? (
          <form.Field name="kind">
            {(field) => (
              <UiField>
                <FieldLabel htmlFor={field.name}>{t("destinations.form.kindLabel")}</FieldLabel>
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
                      <SelectItem value="generic_webhook">
                        {t("destinations.kinds.generic_webhook")}
                      </SelectItem>
                      <SelectItem value="feishu">{t("destinations.kinds.feishu")}</SelectItem>
                      <SelectItem value="slack">{t("destinations.kinds.slack")}</SelectItem>
                      <SelectItem value="email">{t("destinations.kinds.email")}</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FieldDescription>{t("destinations.form.kindDescription")}</FieldDescription>
              </UiField>
            )}
          </form.Field>
        ) : (
          <form.Field name="kind">
            {(field) => (
              <UiField>
                <FieldLabel htmlFor={field.name}>{t("destinations.form.kindLabel")}</FieldLabel>
                <Input id={field.name} value={field.state.value} readOnly aria-readonly />
                <FieldDescription>
                  {t("destinations.form.kindReadonlyDescription")}
                </FieldDescription>
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
            {t("destinations.form.cancel")}
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
          {t("destinations.form.preview")}
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
          {mode === "create"
            ? t("destinations.form.create.submit")
            : t("destinations.form.edit.submit")}
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

function destinationValuesToFormData(values: DestinationFormValues): FormData {
  const data = new FormData();

  for (const [key, value] of Object.entries(values)) {
    data.set(key, value);
  }

  return data;
}
