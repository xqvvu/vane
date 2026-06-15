import { RiAddLine, RiEditLine, RiGitBranchLine } from "@remixicon/react";
import { useForm } from "@tanstack/react-form";
import * as React from "react";

import { FormPanel } from "#/components/common/content-panel.tsx";
import { Button } from "#/components/ui/button.tsx";
import { Checkbox } from "#/components/ui/checkbox.tsx";
import {
  Field as UiField,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
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
  routeFormDefaultsFromRule,
  routeRuleFromValues,
  routeRulePatchFromValues,
  type RouteRuleFormValues,
} from "#/features/routes/model/route-form.ts";
import { useTranslations } from "#/i18n/use-i18n.ts";

export function CreateRouteForm({
  sources,
  destinations,
  pending,
  onSubmit,
}: {
  sources: Configuration["sources"];
  destinations: Configuration["destinations"];
  pending: boolean;
  onSubmit: (input: {
    name: string;
    rule: Configuration["routes"][number]["rule"];
    destinationIds: string[];
  }) => void;
}) {
  const t = useTranslations();

  return (
    <FormPanel
      title={t("routing.form.create.title")}
      icon={<RiGitBranchLine className="size-4" aria-hidden />}
    >
      <p className="text-muted-foreground mb-3 text-xs">{t("routing.form.create.description")}</p>
      <RouteForm
        sources={sources}
        destinations={destinations}
        pending={pending}
        defaultValues={{
          name: "",
          rule: {
            sourceId: "",
            severity: "critical",
            status: "any",
            labelKey: "",
            labelOperator: "equals",
            labelValue: "",
            titleContains: "",
            messageContains: "",
          },
          destinationIds: [],
        }}
        submitLabel={t("routing.form.create.submit")}
        submitIcon={<RiAddLine data-icon="inline-start" aria-hidden />}
        resetOnSubmit
        onSubmit={(values) => {
          onSubmit({
            name: values.name.trim(),
            rule: routeRuleFromValues(values.rule),
            destinationIds: values.destinationIds,
          });
        }}
      />
    </FormPanel>
  );
}

export function EditRouteForm({
  route,
  sources,
  destinations,
  pending,
  onCancel,
  onSubmit,
}: {
  route: Configuration["routes"][number];
  sources: Configuration["sources"];
  destinations: Configuration["destinations"];
  pending: boolean;
  onCancel: () => void;
  onSubmit: (input: {
    id: string;
    name: string;
    rule: Configuration["routes"][number]["rule"];
    destinationIds: string[];
  }) => void;
}) {
  const t = useTranslations();

  return (
    <section className="border-border bg-muted/30 mt-3 border p-3">
      <h3 className="flex items-center gap-2 text-xs font-semibold">
        <RiEditLine className="size-3.5" aria-hidden />
        {t("routing.form.edit.title")}
      </h3>
      <p className="text-muted-foreground mt-1 mb-3 text-xs">
        {t("routing.form.edit.description")}
      </p>
      <RouteForm
        sources={sources}
        destinations={destinations}
        pending={pending}
        defaultValues={{
          name: route.name,
          rule: routeFormDefaultsFromRule(route.rule),
          destinationIds: route.destinationIds,
        }}
        submitLabel={t("routing.form.edit.submit")}
        submitIcon={<RiEditLine data-icon="inline-start" aria-hidden />}
        onSubmit={(values) =>
          onSubmit({
            id: route.id,
            name: values.name.trim(),
            rule: routeRulePatchFromValues(route.rule, values.rule),
            destinationIds: values.destinationIds,
          })
        }
        onCancel={onCancel}
      />
    </section>
  );
}

type RouteFormValues = {
  name: string;
  rule: RouteRuleFormValues;
  destinationIds: string[];
};

function RouteForm({
  sources,
  destinations,
  pending,
  defaultValues,
  submitLabel,
  submitIcon,
  resetOnSubmit = false,
  onSubmit,
  onCancel,
}: {
  sources: Configuration["sources"];
  destinations: Configuration["destinations"];
  pending: boolean;
  defaultValues: RouteFormValues;
  submitLabel: string;
  submitIcon: React.ReactNode;
  resetOnSubmit?: boolean;
  onSubmit: (values: RouteFormValues) => void;
  onCancel?: () => void;
}) {
  const t = useTranslations();

  const sourceItems = [
    { value: null, label: t("routing.form.anySource") },
    ...sources.map((source) => ({ value: source.id, label: source.name })),
  ];
  const routeSeverityItems = [
    { value: "any", label: t("routing.form.severityAny") },
    { value: "critical", label: t("common.severity.critical") },
    { value: "warning", label: t("common.severity.warning") },
    { value: "info", label: t("common.severity.info") },
    { value: "unknown", label: t("common.severity.unknown") },
  ];
  const routeStatusItems = [
    { value: "any", label: t("routing.form.statusAny") },
    { value: "firing", label: t("common.alertStatus.firing") },
    { value: "resolved", label: t("common.alertStatus.resolved") },
    { value: "unknown", label: t("common.alertStatus.unknown") },
  ];
  const labelOperatorItems = [
    { value: "equals", label: t("routing.form.operatorEquals") },
    { value: "contains", label: t("routing.form.operatorContains") },
  ];
  const form = useForm({
    defaultValues,
    onSubmit: ({ value }) => {
      onSubmit(value);

      if (resetOnSubmit) {
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
        void form.handleSubmit();
      }}
    >
      <FieldGroup className="gap-2">
        <form.Field
          name="name"
          validators={{
            onSubmit: ({ value }) =>
              value.trim().length === 0 ? t("routing.form.validation.nameRequired") : undefined,
          }}
        >
          {(field) => (
            <UiField data-invalid={field.state.meta.errors.length > 0}>
              <FieldLabel htmlFor={field.name}>{t("routing.form.nameLabel")}</FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                placeholder={t("routing.form.namePlaceholder")}
                value={field.state.value}
                required
                aria-invalid={field.state.meta.errors.length > 0}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.currentTarget.value)}
              />
              <FieldDescription>{t("routing.form.nameDescription")}</FieldDescription>
              <FieldError
                errors={field.state.meta.errors.map((error) => ({
                  message: String(error),
                }))}
              />
            </UiField>
          )}
        </form.Field>
        <form.Field name="rule.sourceId">
          {(field) => (
            <UiField data-disabled={sources.length === 0}>
              <FieldLabel htmlFor={field.name}>{t("routing.form.sourceLabel")}</FieldLabel>
              <Select
                id={field.name}
                name={field.name}
                items={sourceItems}
                disabled={sources.length === 0}
                value={field.state.value || null}
                onValueChange={(value) => field.handleChange(value ?? "")}
              >
                <SelectTrigger className="w-full" onBlur={field.handleBlur}>
                  <SelectValue placeholder={t("routing.form.anySource")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value={null}>{t("routing.form.anySource")}</SelectItem>
                    {sources.map((source) => (
                      <SelectItem key={source.id} value={source.id}>
                        {source.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FieldDescription>{t("routing.form.sourceDescription")}</FieldDescription>
            </UiField>
          )}
        </form.Field>
        <form.Field name="rule.severity">
          {(field) => (
            <UiField>
              <FieldLabel htmlFor={field.name}>{t("routing.form.severityLabel")}</FieldLabel>
              <Select
                id={field.name}
                name={field.name}
                items={routeSeverityItems}
                value={field.state.value}
                onValueChange={(value) =>
                  field.handleChange(value as RouteRuleFormValues["severity"])
                }
              >
                <SelectTrigger className="w-full" onBlur={field.handleBlur}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="any">{t("routing.form.severityAny")}</SelectItem>
                    <SelectItem value="critical">{t("common.severity.critical")}</SelectItem>
                    <SelectItem value="warning">{t("common.severity.warning")}</SelectItem>
                    <SelectItem value="info">{t("common.severity.info")}</SelectItem>
                    <SelectItem value="unknown">{t("common.severity.unknown")}</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FieldDescription>{t("routing.form.severityDescription")}</FieldDescription>
            </UiField>
          )}
        </form.Field>
        <form.Field name="rule.status">
          {(field) => (
            <UiField>
              <FieldLabel htmlFor={field.name}>{t("routing.form.statusLabel")}</FieldLabel>
              <Select
                id={field.name}
                name={field.name}
                items={routeStatusItems}
                value={field.state.value}
                onValueChange={(value) =>
                  field.handleChange(value as RouteRuleFormValues["status"])
                }
              >
                <SelectTrigger className="w-full" onBlur={field.handleBlur}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="any">{t("routing.form.statusAny")}</SelectItem>
                    <SelectItem value="firing">{t("common.alertStatus.firing")}</SelectItem>
                    <SelectItem value="resolved">{t("common.alertStatus.resolved")}</SelectItem>
                    <SelectItem value="unknown">{t("common.alertStatus.unknown")}</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FieldDescription>{t("routing.form.statusDescription")}</FieldDescription>
            </UiField>
          )}
        </form.Field>
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_116px_minmax(0,1fr)]">
          <form.Field name="rule.labelKey">
            {(field) => (
              <UiField>
                <FieldLabel htmlFor={field.name}>{t("routing.form.labelKeyLabel")}</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  placeholder="service"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.currentTarget.value)}
                />
                <FieldDescription>{t("routing.form.labelKeyDescription")}</FieldDescription>
              </UiField>
            )}
          </form.Field>
          <form.Field name="rule.labelOperator">
            {(field) => (
              <UiField>
                <FieldLabel htmlFor={field.name}>{t("routing.form.operatorLabel")}</FieldLabel>
                <Select
                  id={field.name}
                  name={field.name}
                  items={labelOperatorItems}
                  value={field.state.value}
                  onValueChange={(value) =>
                    field.handleChange(value as RouteRuleFormValues["labelOperator"])
                  }
                >
                  <SelectTrigger className="w-full" onBlur={field.handleBlur}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="equals">{t("routing.form.operatorEquals")}</SelectItem>
                      <SelectItem value="contains">{t("routing.form.operatorContains")}</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FieldDescription>{t("routing.form.operatorDescription")}</FieldDescription>
              </UiField>
            )}
          </form.Field>
          <form.Field name="rule.labelValue">
            {(field) => (
              <UiField>
                <FieldLabel htmlFor={field.name}>{t("routing.form.labelValueLabel")}</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  placeholder="checkout"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.currentTarget.value)}
                />
                <FieldDescription>{t("routing.form.labelValueDescription")}</FieldDescription>
              </UiField>
            )}
          </form.Field>
        </div>
        <form.Field name="rule.titleContains">
          {(field) => (
            <UiField>
              <FieldLabel htmlFor={field.name}>{t("routing.form.titleContainsLabel")}</FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                placeholder="LatencyHigh"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.currentTarget.value)}
              />
              <FieldDescription>{t("routing.form.titleContainsDescription")}</FieldDescription>
            </UiField>
          )}
        </form.Field>
        <form.Field name="rule.messageContains">
          {(field) => (
            <UiField>
              <FieldLabel htmlFor={field.name}>{t("routing.form.messageContainsLabel")}</FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                placeholder="timeout"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.currentTarget.value)}
              />
              <FieldDescription>{t("routing.form.messageContainsDescription")}</FieldDescription>
            </UiField>
          )}
        </form.Field>
        <form.Field name="destinationIds">
          {(field) => (
            <FieldSet
              className="border-border gap-2 border p-2"
              data-disabled={destinations.length === 0}
            >
              <FieldLegend className="text-muted-foreground">
                {t("routing.form.destinationsLegend")}
              </FieldLegend>
              {destinations.length === 0 ? (
                <div className="text-muted-foreground text-xs">
                  {t("routing.form.createDestinationFirst")}
                </div>
              ) : (
                <FieldGroup data-slot="checkbox-group" className="gap-2">
                  {destinations.map((destination) => {
                    const checked = field.state.value.includes(destination.id);

                    return (
                      <UiField key={destination.id} orientation="horizontal">
                        <Checkbox
                          id={`${field.name}-${destination.id}`}
                          name={field.name}
                          value={destination.id}
                          checked={checked}
                          onCheckedChange={(nextChecked) => {
                            field.handleChange(
                              nextChecked
                                ? [...field.state.value, destination.id]
                                : field.state.value.filter((id) => id !== destination.id),
                            );
                          }}
                        />
                        <FieldLabel htmlFor={`${field.name}-${destination.id}`}>
                          <FieldContent>
                            <FieldTitle className="truncate">
                              {destination.name} · {destination.kind}
                            </FieldTitle>
                          </FieldContent>
                        </FieldLabel>
                      </UiField>
                    );
                  })}
                </FieldGroup>
              )}
              <FieldDescription>{t("routing.form.destinationsDescription")}</FieldDescription>
            </FieldSet>
          )}
        </form.Field>
      </FieldGroup>
      <div className={onCancel ? "grid grid-cols-2 gap-2" : undefined}>
        {onCancel ? (
          <Button type="button" variant="outline" size="sm" disabled={pending} onClick={onCancel}>
            {t("routing.form.cancel")}
          </Button>
        ) : null}
        <Button
          type="submit"
          size="sm"
          disabled={pending || destinations.length === 0}
          className={onCancel ? "" : "w-full"}
        >
          {submitIcon}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
