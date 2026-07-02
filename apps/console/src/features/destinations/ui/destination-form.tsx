import { RiAddLine, RiEditLine, RiEyeLine, RiResetLeftLine } from "@remixicon/react";
import { useForm } from "@tanstack/react-form";
import * as React from "react";

import { Button } from "#/components/ui/button.tsx";
import {
  Field as UiField,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
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
import { ToggleGroup, ToggleGroupItem } from "#/components/ui/toggle-group.tsx";
import {
  destinationConfigFromForm,
  destinationConfigPatchFromForm,
  type DestinationTemplateFormMode,
  type DestinationFormKind,
} from "#/features/destinations/model/destination-form.ts";
import type {
  DestinationFormMode,
  DestinationFormSubmitInput,
  DestinationFormValues,
  DestinationSubmitResult,
} from "#/features/destinations/ui/destination-ui-types.ts";
import { useTranslations } from "#/i18n/use-i18n.ts";
import { cn } from "#/lib/utils.ts";

export function DestinationForm({
  mode,
  layout = "panel",
  pending,
  defaultValues,
  onPreview,
  onSubmit,
  onCancel,
}: {
  mode: DestinationFormMode;
  layout?: "panel" | "dialog";
  pending: boolean;
  defaultValues: DestinationFormValues;
  onPreview: (input: DestinationFormSubmitInput) => DestinationSubmitResult;
  onSubmit: (input: DestinationFormSubmitInput) => DestinationSubmitResult;
  onCancel?: () => void;
}) {
  const t = useTranslations();
  const isDialogLayout = layout === "dialog";

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
    onSubmit: async ({ value }) => {
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
      const result =
        submitIntent.current === "preview" ? await onPreview(input) : await onSubmit(input);

      if (mode === "create" && submitIntent.current === "submit" && result !== false) {
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
      className: "min-h-16 max-h-32 resize-y overflow-auto font-mono text-[11px]",
      placeholder: "Authorization: Bearer ...",
      description: t("destinations.form.headersDescription"),
    });

  const renderTemplateFields = (kind: DestinationFormKind) => {
    if (kind !== "feishu") {
      return renderTextTemplateField(kind);
    }

    return (
      <>
        <form.Field name="templateMode">
          {(field) => (
            <UiField>
              <FieldLabel>{t("destinations.form.templateMode")}</FieldLabel>
              <ToggleGroup
                value={[String(field.state.value)]}
                variant="outline"
                size="sm"
                onValueChange={(value) => {
                  const next = value[0] as DestinationTemplateFormMode | undefined;

                  if (next) {
                    field.handleChange(next);
                  }
                }}
              >
                <ToggleGroupItem value="text" aria-label={t("destinations.form.templateModeText")}>
                  {t("destinations.form.templateModeText")}
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="feishu_card"
                  aria-label={t("destinations.form.templateModeFeishuCard")}
                >
                  {t("destinations.form.templateModeFeishuCard")}
                </ToggleGroupItem>
              </ToggleGroup>
              <FieldDescription>{t("destinations.form.templateModeDescription")}</FieldDescription>
            </UiField>
          )}
        </form.Field>
        <form.Subscribe selector={(state) => state.values.templateMode}>
          {(templateMode) =>
            templateMode === "feishu_card"
              ? renderFeishuCardTemplateField()
              : renderTextTemplateField("feishu")
          }
        </form.Subscribe>
        {renderTemplateVariableReference()}
      </>
    );
  };

  const renderTextTemplateField = (kind: DestinationFormKind) =>
    renderTextareaField({
      label: t("destinations.form.template"),
      name: "templateText",
      id: `message-template-${kind}`,
      className: "min-h-20 max-h-40 resize-y overflow-auto font-mono text-[11px]",
      placeholder: "{{event.title}} on {{source.name}}",
      description: t("destinations.form.templateDescription"),
    });

  const renderFeishuCardTemplateField = () => (
    <form.Field name="templateCard">
      {(field) => (
        <UiField>
          <div className="flex items-center justify-between gap-2">
            <FieldLabel htmlFor="feishu-card-template">
              {t("destinations.form.feishuCardTemplate")}
            </FieldLabel>
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={() => field.handleChange(defaultFeishuCardTemplate)}
            >
              <RiResetLeftLine data-icon="inline-start" aria-hidden />
              {t("destinations.form.restoreDefaultCard")}
            </Button>
          </div>
          <Textarea
            id="feishu-card-template"
            name={field.name}
            className="max-h-[min(42dvh,28rem)] min-h-56 resize-y overflow-auto font-mono text-[11px]"
            placeholder={feishuCardTemplatePlaceholder}
            value={String(field.state.value)}
            onBlur={field.handleBlur}
            onChange={(event) => field.handleChange(event.currentTarget.value)}
          />
          <FieldDescription>
            {t("destinations.form.feishuCardTemplateDescription")}
          </FieldDescription>
        </UiField>
      )}
    </form.Field>
  );

  const renderTemplateVariableReference = () => (
    <form.Subscribe
      selector={(state) => ({
        mode: state.values.templateMode,
        text: state.values.templateText,
        card: state.values.templateCard,
      })}
    >
      {({ mode: templateMode, text, card }) => (
        <UiField>
          <FieldLabel>{t("destinations.form.variables")}</FieldLabel>
          <div className="flex flex-wrap gap-1">
            {templateVariablePaths.map((path) => (
              <Button
                key={path}
                type="button"
                variant="outline"
                size="xs"
                onClick={() => {
                  const variable = `{{${path}}}`;

                  if (templateMode === "feishu_card") {
                    form.setFieldValue("templateCard", appendTemplateVariable(card, variable));
                    return;
                  }

                  form.setFieldValue("templateText", appendTemplateVariable(text, variable));
                }}
              >
                {path}
              </Button>
            ))}
          </div>
          <FieldDescription>{t("destinations.form.variablesDescription")}</FieldDescription>
        </UiField>
      )}
    </form.Subscribe>
  );

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
    </>
  );

  return (
    <form
      className={cn("flex flex-col", isDialogLayout ? "min-h-0 flex-1 overflow-hidden" : "gap-3")}
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <div
        className={cn(
          isDialogLayout
            ? "-mx-1 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-1 pb-1"
            : "flex flex-col gap-3",
        )}
      >
        <FieldSet className="gap-3">
          {isDialogLayout ? (
            <FieldLegend variant="label">{t("destinations.form.section.identity")}</FieldLegend>
          ) : null}
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
        </FieldSet>
        <div
          className={cn(
            isDialogLayout
              ? "grid gap-4 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]"
              : "flex flex-col gap-3",
          )}
        >
          <FieldSet className="min-w-0 gap-3">
            {isDialogLayout ? (
              <FieldLegend variant="label">{t("destinations.form.section.delivery")}</FieldLegend>
            ) : null}
            <FieldGroup className="gap-3">
              <form.Subscribe selector={(state) => state.values.kind}>
                {(kind) => renderDestinationConfigFields(kind)}
              </form.Subscribe>
            </FieldGroup>
          </FieldSet>
          <FieldSet className="min-w-0 gap-3">
            {isDialogLayout ? (
              <FieldLegend variant="label">{t("destinations.form.section.template")}</FieldLegend>
            ) : null}
            <FieldGroup className="gap-3">
              <form.Subscribe selector={(state) => state.values.kind}>
                {(kind) => renderTemplateFields(kind)}
              </form.Subscribe>
            </FieldGroup>
          </FieldSet>
        </div>
      </div>
      <div
        className={cn(
          "flex flex-col gap-2 sm:flex-row sm:justify-end",
          isDialogLayout ? "border-border bg-popover shrink-0 border-t pt-3" : "",
        )}
      >
        {mode === "edit" ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full sm:w-fit"
            disabled={pending}
            onClick={onCancel}
          >
            {t("destinations.form.cancel")}
          </Button>
        ) : null}
        <Button
          type="submit"
          variant="outline"
          size="sm"
          className="w-full sm:w-fit"
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
          className="w-full sm:w-fit"
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

export function createDestinationDefaults(): DestinationFormValues {
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
    templateMode: "text",
    templateText: "",
    templateCard: defaultFeishuCardTemplate,
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

function appendTemplateVariable(currentValue: string, variable: string): string {
  return currentValue.trimEnd() ? `${currentValue} ${variable}` : variable;
}

const templateVariablePaths = [
  "event.title",
  "event.message",
  "event.severity",
  "event.status",
  "event.fingerprint",
  "event.labels.service",
  "event.labels.environment",
  "source.name",
  "destination.name",
  "vane.eventUrl",
];

const defaultFeishuCardTemplate = JSON.stringify(
  {
    header: {
      title: {
        tag: "plain_text",
        content: "[{{event.severity}}] {{event.title}}",
      },
    },
    elements: [
      {
        tag: "div",
        text: {
          tag: "lark_md",
          content:
            "**Status:** {{event.status}}\n**Source:** {{source.name}}\n**Service:** {{event.labels.service}}\n**Message:** {{event.message}}",
        },
      },
      {
        tag: "hr",
      },
      {
        tag: "note",
        elements: [
          {
            tag: "plain_text",
            content: "Fingerprint: {{event.fingerprint}}",
          },
        ],
      },
    ],
  },
  null,
  2,
);

const feishuCardTemplatePlaceholder = defaultFeishuCardTemplate;
