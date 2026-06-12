import { RiAddLine, RiEditLine, RiGitBranchLine } from "@remixicon/react";
import { useForm } from "@tanstack/react-form";
import * as React from "react";

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
import { NativeSelect, NativeSelectOption } from "#/components/ui/native-select.tsx";
import type { Configuration } from "#/features/configuration/model/configuration-types.ts";
import {
  routeFormDefaultsFromRule,
  routeRuleFromValues,
  routeRulePatchFromValues,
  type RouteRuleFormValues,
} from "#/features/routes/model/route-form.ts";
import { DashboardFormPanel } from "#/shell/dashboard-panel.tsx";

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
  return (
    <DashboardFormPanel title="New route" icon={<RiGitBranchLine className="size-4" aria-hidden />}>
      <p className="text-muted-foreground mb-3 text-xs">
        Match normalized event fields and send matching events to selected destinations.
      </p>
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
        submitLabel="Create route"
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
    </DashboardFormPanel>
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
  return (
    <section className="border-border bg-muted/30 mt-3 border p-3">
      <h3 className="flex items-center gap-2 text-xs font-semibold">
        <RiEditLine className="size-3.5" aria-hidden />
        Edit route
      </h3>
      <p className="text-muted-foreground mt-1 mb-3 text-xs">
        Update the first editable condition while preserving any additional rule conditions.
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
        submitLabel="Save route"
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
              value.trim().length === 0 ? "Route name is required" : undefined,
          }}
        >
          {(field) => (
            <UiField data-invalid={field.state.meta.errors.length > 0}>
              <FieldLabel htmlFor={field.name}>Name</FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                placeholder="Critical to ops"
                value={field.state.value}
                required
                aria-invalid={field.state.meta.errors.length > 0}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.currentTarget.value)}
              />
              <FieldDescription>A short operational name for this routing rule.</FieldDescription>
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
              <FieldLabel htmlFor={field.name}>Source</FieldLabel>
              <NativeSelect
                id={field.name}
                name={field.name}
                className="w-full"
                disabled={sources.length === 0}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.currentTarget.value)}
              >
                <NativeSelectOption value="">Any source</NativeSelectOption>
                {sources.map((source) => (
                  <NativeSelectOption key={source.id} value={source.id}>
                    {source.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              <FieldDescription>Leave as any source for catch-all routing.</FieldDescription>
            </UiField>
          )}
        </form.Field>
        <form.Field name="rule.severity">
          {(field) => (
            <UiField>
              <FieldLabel htmlFor={field.name}>Severity</FieldLabel>
              <NativeSelect
                id={field.name}
                name={field.name}
                className="w-full"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) =>
                  field.handleChange(event.currentTarget.value as RouteRuleFormValues["severity"])
                }
              >
                <NativeSelectOption value="any">Any</NativeSelectOption>
                <NativeSelectOption value="critical">Critical</NativeSelectOption>
                <NativeSelectOption value="warning">Warning</NativeSelectOption>
                <NativeSelectOption value="info">Info</NativeSelectOption>
                <NativeSelectOption value="unknown">Unknown</NativeSelectOption>
              </NativeSelect>
              <FieldDescription>Empty severity conditions match every severity.</FieldDescription>
            </UiField>
          )}
        </form.Field>
        <form.Field name="rule.status">
          {(field) => (
            <UiField>
              <FieldLabel htmlFor={field.name}>Status</FieldLabel>
              <NativeSelect
                id={field.name}
                name={field.name}
                className="w-full"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) =>
                  field.handleChange(event.currentTarget.value as RouteRuleFormValues["status"])
                }
              >
                <NativeSelectOption value="any">Any</NativeSelectOption>
                <NativeSelectOption value="firing">Firing</NativeSelectOption>
                <NativeSelectOption value="resolved">Resolved</NativeSelectOption>
                <NativeSelectOption value="unknown">Unknown</NativeSelectOption>
              </NativeSelect>
              <FieldDescription>Match firing, resolved, or unknown alert states.</FieldDescription>
            </UiField>
          )}
        </form.Field>
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_116px_minmax(0,1fr)]">
          <form.Field name="rule.labelKey">
            {(field) => (
              <UiField>
                <FieldLabel htmlFor={field.name}>Label key</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  placeholder="service"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.currentTarget.value)}
                />
                <FieldDescription>Normalized label key.</FieldDescription>
              </UiField>
            )}
          </form.Field>
          <form.Field name="rule.labelOperator">
            {(field) => (
              <UiField>
                <FieldLabel htmlFor={field.name}>Operator</FieldLabel>
                <NativeSelect
                  id={field.name}
                  name={field.name}
                  className="w-full"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) =>
                    field.handleChange(
                      event.currentTarget.value as RouteRuleFormValues["labelOperator"],
                    )
                  }
                >
                  <NativeSelectOption value="equals">Equals</NativeSelectOption>
                  <NativeSelectOption value="contains">Contains</NativeSelectOption>
                </NativeSelect>
                <FieldDescription>Comparison mode.</FieldDescription>
              </UiField>
            )}
          </form.Field>
          <form.Field name="rule.labelValue">
            {(field) => (
              <UiField>
                <FieldLabel htmlFor={field.name}>Label value</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  placeholder="checkout"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.currentTarget.value)}
                />
                <FieldDescription>Required with a label key.</FieldDescription>
              </UiField>
            )}
          </form.Field>
        </div>
        <form.Field name="rule.titleContains">
          {(field) => (
            <UiField>
              <FieldLabel htmlFor={field.name}>Title contains</FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                placeholder="LatencyHigh"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.currentTarget.value)}
              />
              <FieldDescription>Simple substring match against normalized title.</FieldDescription>
            </UiField>
          )}
        </form.Field>
        <form.Field name="rule.messageContains">
          {(field) => (
            <UiField>
              <FieldLabel htmlFor={field.name}>Message contains</FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                placeholder="timeout"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.currentTarget.value)}
              />
              <FieldDescription>
                Simple substring match against normalized message.
              </FieldDescription>
            </UiField>
          )}
        </form.Field>
        <form.Field name="destinationIds">
          {(field) => (
            <FieldSet
              className="border-border gap-2 border p-2"
              data-disabled={destinations.length === 0}
            >
              <FieldLegend className="text-muted-foreground">Destinations</FieldLegend>
              {destinations.length === 0 ? (
                <div className="text-muted-foreground text-xs">Create a destination first</div>
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
              <FieldDescription>Routes must select at least one destination.</FieldDescription>
            </FieldSet>
          )}
        </form.Field>
      </FieldGroup>
      <div className={onCancel ? "grid grid-cols-2 gap-2" : undefined}>
        {onCancel ? (
          <Button type="button" variant="outline" size="sm" disabled={pending} onClick={onCancel}>
            Cancel
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
