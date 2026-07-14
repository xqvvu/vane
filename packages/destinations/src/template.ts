import { z } from "zod";

import { JsonObjectSchema } from "@vane/core";
import type { DestinationSummary, JsonObject, JsonValue, SourceSummary } from "@vane/core";

import { displaySeverity, displayStatus, formatDestinationDateTime } from "#/presentation.ts";
import type { DestinationSendInput } from "#/types.ts";

const TEMPLATE_VARIABLE_PATTERN = /\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g;
const LABEL_PATH_PATTERN = /^event\.labels\.([a-zA-Z0-9_.-]+)$/;
const BINDING_PATH_PATTERN = /^bindings\.([a-zA-Z][a-zA-Z0-9_-]{0,63})$/;
const TEMPLATE_BINDING_NAME_PATTERN = /^[a-zA-Z][a-zA-Z0-9_-]{0,63}$/;
const TEMPLATE_BINDING_VALUE_MAX_LENGTH = 256;

export const TemplateBindingSelectorSchema = z.enum([
  "event.status",
  "event.severity",
  "source.provider",
  "destination.kind",
]);

export const TemplateBindingSchema = z.strictObject({
  select: TemplateBindingSelectorSchema,
  cases: z
    .record(z.string().min(1).max(128), z.string().max(TEMPLATE_BINDING_VALUE_MAX_LENGTH))
    .refine((cases) => Object.keys(cases).length > 0, {
      message: "Destination template binding cases must not be empty",
    }),
  fallback: z.string().max(TEMPLATE_BINDING_VALUE_MAX_LENGTH),
});

export const TemplateBindingsSchema = z
  .record(
    z.string().regex(TEMPLATE_BINDING_NAME_PATTERN, {
      message: "Destination template binding name is invalid",
    }),
    TemplateBindingSchema,
  )
  .refine((bindings) => Object.keys(bindings).length <= 32, {
    message: "Destination template supports at most 32 bindings",
  });

export type TemplateBindingSelector = z.infer<typeof TemplateBindingSelectorSchema>;
export type TemplateBinding = z.infer<typeof TemplateBindingSchema>;
export type TemplateBindings = z.infer<typeof TemplateBindingsSchema>;

type TemplateStaticPath =
  | "event.id"
  | "event.title"
  | "event.message"
  | "event.severity"
  | "event.severityDisplay"
  | "event.status"
  | "event.statusDisplay"
  | "event.fingerprint"
  | "event.occurredAt"
  | "event.occurredAtDisplay"
  | "source.id"
  | "source.name"
  | "source.provider"
  | "destination.id"
  | "destination.name"
  | "destination.kind"
  | "vane.eventUrl";

type TemplateStaticPathResolver = (context: TemplateContext) => string;

const TemplateStaticPathResolvers = {
  "event.id": (context) => context.event.id,
  "event.title": (context) => context.event.title,
  "event.message": (context) => context.event.message,
  "event.severity": (context) => context.event.severity,
  "event.severityDisplay": (context) => context.event.severityDisplay,
  "event.status": (context) => context.event.status,
  "event.statusDisplay": (context) => context.event.statusDisplay,
  "event.fingerprint": (context) => context.event.fingerprint,
  "event.occurredAt": (context) => context.event.occurredAt,
  "event.occurredAtDisplay": (context) => context.event.occurredAtDisplay,
  "source.id": (context) => context.source.id,
  "source.name": (context) => context.source.name,
  "source.provider": (context) => context.source.provider,
  "destination.id": (context) => context.destination.id,
  "destination.name": (context) => context.destination.name,
  "destination.kind": (context) => context.destination.kind,
  "vane.eventUrl": (context) => context.vane.eventUrl,
} satisfies Record<TemplateStaticPath, TemplateStaticPathResolver>;

const AllowedTemplatePaths: ReadonlySet<TemplateStaticPath> = new Set(
  Object.keys(TemplateStaticPathResolvers) as TemplateStaticPath[],
);

export const TextDestinationTemplateSchema = z
  .strictObject({
    mode: z.literal("text"),
    text: z.string().trim().min(1).max(4000),
    bindings: TemplateBindingsSchema.optional(),
  })
  .superRefine((template, context) => {
    for (const diagnostic of DestinationTemplateEngine.diagnoseTextTemplate(
      template.text,
      "template.text",
      template.bindings,
    )) {
      if (diagnostic.severity !== "error") {
        continue;
      }

      context.addIssue({
        code: "custom",
        path: ["text"],
        message: diagnostic.message,
      });
    }
  });

export const FeishuCardDestinationTemplateSchema = z
  .strictObject({
    mode: z.literal("feishu_card"),
    card: JsonObjectSchema,
    bindings: TemplateBindingsSchema.optional(),
  })
  .superRefine((template, context) => {
    for (const diagnostic of DestinationTemplateEngine.diagnoseJsonTemplate(
      template.card,
      "template.card",
      template.bindings,
    )) {
      if (diagnostic.severity !== "error") {
        continue;
      }

      context.addIssue({
        code: "custom",
        path: diagnostic.path?.replace(/^template\./, "").split(".") ?? ["card"],
        message: diagnostic.message,
      });
    }
  });

export const DestinationTemplateSchema = z.discriminatedUnion("mode", [
  TextDestinationTemplateSchema,
  FeishuCardDestinationTemplateSchema,
]);

export const TextOnlyDestinationTemplateSchema = TextDestinationTemplateSchema;

export type TextDestinationTemplate = z.infer<typeof TextDestinationTemplateSchema>;
export type FeishuCardDestinationTemplate = z.infer<typeof FeishuCardDestinationTemplateSchema>;
export type DestinationTemplate = z.infer<typeof DestinationTemplateSchema>;
export type DestinationTemplateMode = DestinationTemplate["mode"];

export interface TemplateContext {
  event: {
    id: string;
    title: string;
    message: string;
    severity: string;
    severityDisplay: string;
    status: string;
    statusDisplay: string;
    fingerprint: string;
    occurredAt: string;
    occurredAtDisplay: string;
    labels: Record<string, string>;
  };
  source: {
    id: string;
    name: string;
    provider: string;
  };
  destination: {
    id: string;
    name: string;
    kind: string;
  };
  vane: {
    eventUrl: string;
  };
  bindings: Record<string, string>;
}

export interface TemplateDiagnostic {
  severity: "error" | "warning";
  path?: string;
  variable?: string;
  message: string;
}

export interface RenderTemplateResult<T extends JsonValue | string = JsonValue | string> {
  ok: boolean;
  value: T;
  diagnostics: TemplateDiagnostic[];
}

export class TemplateValidationError extends Error {
  readonly diagnostics: TemplateDiagnostic[];

  constructor(diagnostics: TemplateDiagnostic[]) {
    super(diagnostics[0]?.message ?? "Destination template is invalid");
    this.name = "TemplateValidationError";
    this.diagnostics = diagnostics;
  }
}

export class DestinationTemplateEngine {
  static createRenderContext(
    input: DestinationSendInput<unknown>,
    options: { eventUrl?: string; bindings?: TemplateBindings } = {},
  ): TemplateContext {
    const context: TemplateContext = {
      event: {
        id: input.eventId,
        title: input.normalizedEvent.title,
        message: input.normalizedEvent.message,
        severity: input.normalizedEvent.severity,
        severityDisplay: displaySeverity(input.normalizedEvent.severity, input.presentation),
        status: input.normalizedEvent.status,
        statusDisplay: displayStatus(input.normalizedEvent.status, input.presentation),
        fingerprint: input.normalizedEvent.fingerprint,
        occurredAt: input.normalizedEvent.occurredAt,
        occurredAtDisplay: formatDestinationDateTime(
          input.normalizedEvent.occurredAt,
          input.presentation,
        ),
        labels: input.normalizedEvent.labels,
      },
      source: templateSource(input.source),
      destination: templateDestination(input.destination),
      vane: {
        eventUrl: options.eventUrl ?? "",
      },
      bindings: {},
    };

    context.bindings = resolveTemplateBindings(
      context,
      options.bindings ?? templateBindingsFromConfig(input.config),
    );

    return context;
  }

  static diagnoseDestinationTemplate(
    template: DestinationTemplate,
    path = "template",
  ): TemplateDiagnostic[] {
    return template.mode === "text"
      ? this.diagnoseTextTemplate(template.text, `${path}.text`, template.bindings)
      : this.diagnoseJsonTemplate(template.card, `${path}.card`, template.bindings);
  }

  static diagnoseConfig(config: JsonObject): TemplateDiagnostic[] {
    const parsed = DestinationTemplateSchema.safeParse(config.template);

    return parsed.success ? this.diagnoseDestinationTemplate(parsed.data) : [];
  }

  static diagnoseTemplateValue(
    template: JsonValue | string,
    path = "template",
  ): TemplateDiagnostic[] {
    return typeof template === "string"
      ? this.diagnoseTextTemplate(template, path)
      : this.diagnoseJsonTemplate(template, path);
  }

  static diagnoseTextTemplate(
    template: string,
    path = "text",
    bindings: TemplateBindings = {},
  ): TemplateDiagnostic[] {
    return diagnosticsForTemplateEntries([{ template, path }], bindings);
  }

  static diagnoseJsonTemplate(
    template: JsonValue,
    path = "template",
    bindings: TemplateBindings = {},
  ): TemplateDiagnostic[] {
    return diagnosticsForTemplateEntries(templateStringEntries(template, path), bindings);
  }

  static renderText(
    context: TemplateContext,
    template: string,
    path = "text",
    bindings: TemplateBindings = {},
  ): RenderTemplateResult<string> {
    const diagnostics = this.diagnoseTextTemplate(template, path, bindings);

    if (hasErrorDiagnostics(diagnostics)) {
      return {
        ok: false,
        value: "",
        diagnostics,
      };
    }

    return {
      ok: true,
      value: interpolateTemplateString(contextWithBindings(context, bindings), template),
      diagnostics,
    };
  }

  static renderJson(
    context: TemplateContext,
    template: JsonValue,
    path = "template",
    bindings: TemplateBindings = {},
  ): RenderTemplateResult<JsonValue> {
    const diagnostics = this.diagnoseJsonTemplate(template, path, bindings);

    if (hasErrorDiagnostics(diagnostics)) {
      return {
        ok: false,
        value: null,
        diagnostics,
      };
    }

    return {
      ok: true,
      value: interpolateJsonTemplate(contextWithBindings(context, bindings), template),
      diagnostics,
    };
  }

  static renderTextOrThrow(
    context: TemplateContext,
    template: string,
    path = "text",
    bindings: TemplateBindings = {},
  ): string {
    const rendered = this.renderText(context, template, path, bindings);

    if (!rendered.ok) {
      throw new TemplateValidationError(rendered.diagnostics);
    }

    return rendered.value;
  }

  static renderJsonOrThrow(
    context: TemplateContext,
    template: JsonValue,
    path = "template",
    bindings: TemplateBindings = {},
  ): JsonValue {
    const rendered = this.renderJson(context, template, path, bindings);

    if (!rendered.ok) {
      throw new TemplateValidationError(rendered.diagnostics);
    }

    return rendered.value;
  }

  static assertTextTemplateIsValid(
    template: string,
    path = "text",
    bindings: TemplateBindings = {},
  ): void {
    const diagnostics = this.diagnoseTextTemplate(template, path, bindings);

    if (hasErrorDiagnostics(diagnostics)) {
      throw new TemplateValidationError(diagnostics);
    }
  }

  static assertJsonTemplateIsValid(
    template: JsonValue,
    path = "template",
    bindings: TemplateBindings = {},
  ): void {
    const diagnostics = this.diagnoseJsonTemplate(template, path, bindings);

    if (hasErrorDiagnostics(diagnostics)) {
      throw new TemplateValidationError(diagnostics);
    }
  }

  static isValidationError(error: unknown): error is TemplateValidationError {
    return error instanceof TemplateValidationError;
  }

  static validationErrorToPayload(error: TemplateValidationError): JsonObject {
    return {
      templateError: {
        diagnostics: error.diagnostics.map((diagnostic) => ({
          severity: diagnostic.severity,
          path: diagnostic.path ?? null,
          variable: diagnostic.variable ?? null,
          message: diagnostic.message,
        })),
      },
    };
  }
}

interface TemplateStringEntry {
  template: string;
  path: string;
}

function templateStringEntries(value: JsonValue, path: string): TemplateStringEntry[] {
  if (typeof value === "string") {
    return [{ template: value, path }];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item, index) => templateStringEntries(item, `${path}.${index}`));
  }

  if (isJsonObject(value)) {
    return Object.entries(value).flatMap(([key, item]) =>
      templateStringEntries(item, `${path}.${key}`),
    );
  }

  return [];
}

function diagnosticsForTemplateEntries(
  entries: TemplateStringEntry[],
  bindings: TemplateBindings,
): TemplateDiagnostic[] {
  const bindingNames = new Set(Object.keys(bindings));
  const referencedBindings = new Set<string>();
  const diagnostics: TemplateDiagnostic[] = [];

  for (const entry of entries) {
    for (const match of entry.template.matchAll(TEMPLATE_VARIABLE_PATTERN)) {
      const variable = match[1]!;
      const bindingMatch = BINDING_PATH_PATTERN.exec(variable);

      if (bindingMatch && bindingNames.has(bindingMatch[1]!)) {
        referencedBindings.add(bindingMatch[1]!);
      }

      if (!isAllowedTemplatePath(variable, bindingNames)) {
        diagnostics.push({
          severity: "error",
          path: entry.path,
          variable,
          message: `Destination template contains unknown variable: ${variable}`,
        });
      }
    }
  }

  for (const bindingName of bindingNames) {
    if (!referencedBindings.has(bindingName)) {
      diagnostics.push({
        severity: "warning",
        path: `template.bindings.${bindingName}`,
        variable: `bindings.${bindingName}`,
        message: `Destination template binding is not referenced: ${bindingName}`,
      });
    }
  }

  return diagnostics;
}

function interpolateJsonTemplate(context: TemplateContext, value: JsonValue): JsonValue {
  if (typeof value === "string") {
    return interpolateTemplateString(context, value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => interpolateJsonTemplate(context, item));
  }

  if (isJsonObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, interpolateJsonTemplate(context, item)]),
    );
  }

  return value;
}

function interpolateTemplateString(context: TemplateContext, template: string): string {
  return template.replaceAll(TEMPLATE_VARIABLE_PATTERN, (_match, rawPath: string) =>
    templateValue(context, rawPath),
  );
}

function templateValue(context: TemplateContext, path: string): string {
  if (isTemplateStaticPath(path)) {
    return TemplateStaticPathResolvers[path](context);
  }

  const labelMatch = LABEL_PATH_PATTERN.exec(path);

  if (labelMatch) {
    return context.event.labels[labelMatch[1]!] ?? "";
  }

  const bindingMatch = BINDING_PATH_PATTERN.exec(path);

  if (bindingMatch) {
    return context.bindings[bindingMatch[1]!] ?? "";
  }

  return "";
}

function isAllowedTemplatePath(path: string, bindingNames: ReadonlySet<string>): boolean {
  if (isTemplateStaticPath(path) || LABEL_PATH_PATTERN.test(path)) {
    return true;
  }

  const bindingMatch = BINDING_PATH_PATTERN.exec(path);

  return Boolean(bindingMatch && bindingNames.has(bindingMatch[1]!));
}

function resolveTemplateBindings(
  context: TemplateContext,
  bindings: TemplateBindings,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(bindings).map(([name, binding]) => {
      const selectorValue = templateBindingSelectorValue(context, binding.select);
      const value = Object.hasOwn(binding.cases, selectorValue)
        ? binding.cases[selectorValue]!
        : binding.fallback;

      return [name, value];
    }),
  );
}

function contextWithBindings(
  context: TemplateContext,
  bindings: TemplateBindings,
): TemplateContext {
  return {
    ...context,
    bindings: resolveTemplateBindings(context, bindings),
  };
}

function templateBindingSelectorValue(
  context: TemplateContext,
  selector: TemplateBindingSelector,
): string {
  switch (selector) {
    case "event.status":
      return context.event.status;
    case "event.severity":
      return context.event.severity;
    case "source.provider":
      return context.source.provider;
    case "destination.kind":
      return context.destination.kind;
  }
}

function templateBindingsFromConfig(config: unknown): TemplateBindings {
  if (!isUnknownRecord(config)) {
    return {};
  }

  const template = config.template;

  if (!isUnknownRecord(template)) {
    return {};
  }

  const parsed = TemplateBindingsSchema.safeParse(template.bindings);

  return parsed.success ? parsed.data : {};
}

function hasErrorDiagnostics(diagnostics: TemplateDiagnostic[]): boolean {
  return diagnostics.some((diagnostic) => diagnostic.severity === "error");
}

function isUnknownRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isTemplateStaticPath(path: string): path is TemplateStaticPath {
  return AllowedTemplatePaths.has(path as TemplateStaticPath);
}

function isJsonObject(value: JsonValue): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function templateSource(source: SourceSummary): TemplateContext["source"] {
  return {
    id: source.id,
    name: source.name,
    provider: source.provider,
  };
}

function templateDestination(destination: DestinationSummary): TemplateContext["destination"] {
  return {
    id: destination.id,
    name: destination.name,
    kind: destination.kind,
  };
}
