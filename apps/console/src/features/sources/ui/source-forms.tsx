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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select.tsx";
import type { Configuration } from "#/features/configuration/model/configuration-types.ts";
import {
  sourceConfigFromForm,
  sourceConfigPatchFromForm,
} from "#/features/sources/model/source-form.ts";
import { useTranslations } from "#/i18n/use-i18n.ts";
import { cn } from "#/lib/utils.ts";

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
  const t = useTranslations();

  return (
    <section>
      <div className="mb-6">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <RiAddCircleLine className="size-4" aria-hidden />
          {t("sources.form.create.title")}
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">{t("sources.form.create.description")}</p>
      </div>
      <SourceForm
        defaultValues={{
          name: "",
          provider: "generic",
        }}
        pending={pending}
        submitLabel={t("sources.form.create.submit")}
        submitIcon={<RiAddLine data-icon="inline-start" aria-hidden />}
        layout="rail"
        onSubmit={onSubmit}
      />
      <p className="text-muted-foreground mt-3 text-[11px] leading-relaxed">
        {t("sources.form.create.afterCreateHint")}
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
  const t = useTranslations();

  return (
    <section className="border-border bg-muted/30 mt-3 border p-3">
      <h3 className="flex items-center gap-2 text-xs font-semibold">
        <RiEditLine className="size-3.5" aria-hidden />
        {t("sources.form.edit.title")}
      </h3>
      <p className="text-muted-foreground mt-1 mb-3 text-xs">
        {t("sources.form.edit.description")}
      </p>
      <SourceForm
        defaultValues={{
          name: source.name,
          provider: source.provider,
        }}
        pending={pending}
        submitLabel={t("sources.form.edit.submit")}
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
  const t = useTranslations();

  const pendingConfig = React.useRef<JsonObject | undefined>(undefined);
  const providerItems = React.useMemo(
    () => [
      { value: "generic", label: t("sources.providers.genericWebhook") },
      { value: "grafana", label: t("sources.providers.grafana") },
      { value: "signoz", label: t("sources.providers.signoz") },
      { value: "uptime_kuma", label: t("sources.providers.uptime_kuma") },
      { value: "alertmanager", label: t("sources.providers.alertmanager") },
    ],
    [t],
  );
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
              return value.trim().length === 0
                ? t("sources.form.validation.nameRequired")
                : undefined;
            },
          }}
        >
          {(field) => (
            <UiField data-invalid={field.state.meta.errors.length > 0}>
              <FieldLabel className={labelClassName(layout)} htmlFor={field.name}>
                {t("sources.form.nameLabel")}
              </FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                className={inputClassName(layout)}
                placeholder={
                  layout === "rail"
                    ? t("sources.form.namePlaceholderRail")
                    : t("sources.form.namePlaceholderCompact")
                }
                value={field.state.value}
                aria-invalid={field.state.meta.errors.length > 0}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.currentTarget.value)}
              />
              {layout === "compact" ? (
                <FieldDescription>{t("sources.form.nameDescription")}</FieldDescription>
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
                {t("sources.form.providerLabel")}
              </FieldLabel>
              <Select
                id={field.name}
                name={field.name}
                items={providerItems}
                value={field.state.value}
                onValueChange={(value) =>
                  field.handleChange(value as Configuration["sources"][number]["provider"])
                }
              >
                <SelectTrigger
                  className={cn("w-full", inputClassName(layout))}
                  onBlur={field.handleBlur}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="generic">{t("sources.providers.genericWebhook")}</SelectItem>
                    <SelectItem value="grafana">{t("sources.providers.grafana")}</SelectItem>
                    <SelectItem value="signoz">{t("sources.providers.signoz")}</SelectItem>
                    <SelectItem value="uptime_kuma">
                      {t("sources.providers.uptime_kuma")}
                    </SelectItem>
                    <SelectItem value="alertmanager">
                      {t("sources.providers.alertmanager")}
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              {layout === "compact" ? (
                <FieldDescription>{t("sources.form.providerDescription")}</FieldDescription>
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
          {onCancel
            ? t("sources.form.signingSecretOverrideLabel")
            : t("sources.form.signingSecretLabel")}
        </FieldLabel>
        <Input
          id={onCancel ? "edit-signingSecret" : "create-signingSecret"}
          name="signingSecret"
          type="password"
          className={inputClassName(layout)}
          placeholder={
            onCancel
              ? t("sources.form.signingSecretOverridePlaceholder")
              : t("sources.form.signingSecretPlaceholder")
          }
        />
        <FieldDescription>{t("sources.form.signingSecretDescription")}</FieldDescription>
      </UiField>
      <div className={onCancel ? "grid grid-cols-2 gap-2" : undefined}>
        {onCancel ? (
          <Button type="button" variant="outline" size="sm" disabled={pending} onClick={onCancel}>
            {t("sources.form.cancel")}
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
