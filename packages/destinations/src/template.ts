import { z } from "zod";

import { JsonObjectSchema } from "@vane/core";
import type { DestinationSummary, JsonObject, JsonValue, SourceSummary } from "@vane/core";

import type { DestinationSendInput } from "#/types.ts";

const TEMPLATE_VARIABLE_PATTERN = /\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g;
const LABEL_PATH_PATTERN = /^event\.labels\.([a-zA-Z0-9_.-]+)$/;

type TemplateStaticPath =
  | "event.id"
  | "event.title"
  | "event.message"
  | "event.severity"
  | "event.status"
  | "event.fingerprint"
  | "event.occurredAt"
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
  "event.status": (context) => context.event.status,
  "event.fingerprint": (context) => context.event.fingerprint,
  "event.occurredAt": (context) => context.event.occurredAt,
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
  })
  .superRefine((template, context) => {
    for (const diagnostic of DestinationTemplateEngine.diagnoseTextTemplate(
      template.text,
      "template.text",
    )) {
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
  })
  .superRefine((template, context) => {
    for (const diagnostic of DestinationTemplateEngine.diagnoseJsonTemplate(
      template.card,
      "template.card",
    )) {
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
    status: string;
    fingerprint: string;
    occurredAt: string;
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
    options: { eventUrl?: string } = {},
  ): TemplateContext {
    return {
      event: {
        id: input.eventId,
        title: input.normalizedEvent.title,
        message: input.normalizedEvent.message,
        severity: input.normalizedEvent.severity,
        status: input.normalizedEvent.status,
        fingerprint: input.normalizedEvent.fingerprint,
        occurredAt: input.normalizedEvent.occurredAt,
        labels: input.normalizedEvent.labels,
      },
      source: templateSource(input.source),
      destination: templateDestination(input.destination),
      vane: {
        eventUrl: options.eventUrl ?? "",
      },
    };
  }

  static diagnoseTemplateValue(
    template: JsonValue | string,
    path = "template",
  ): TemplateDiagnostic[] {
    return typeof template === "string"
      ? this.diagnoseTextTemplate(template, path)
      : this.diagnoseJsonTemplate(template, path);
  }

  static diagnoseTextTemplate(template: string, path = "text"): TemplateDiagnostic[] {
    return diagnosticsForTemplateString(template, path);
  }

  static diagnoseJsonTemplate(template: JsonValue, path = "template"): TemplateDiagnostic[] {
    return diagnosticsForJsonTemplate(template, path);
  }

  static renderText(
    context: TemplateContext,
    template: string,
    path = "text",
  ): RenderTemplateResult<string> {
    const diagnostics = this.diagnoseTextTemplate(template, path);

    if (diagnostics.length > 0) {
      return {
        ok: false,
        value: "",
        diagnostics,
      };
    }

    return {
      ok: true,
      value: interpolateTemplateString(context, template),
      diagnostics: [],
    };
  }

  static renderJson(
    context: TemplateContext,
    template: JsonValue,
    path = "template",
  ): RenderTemplateResult<JsonValue> {
    const diagnostics = this.diagnoseJsonTemplate(template, path);

    if (diagnostics.length > 0) {
      return {
        ok: false,
        value: null,
        diagnostics,
      };
    }

    return {
      ok: true,
      value: interpolateJsonTemplate(context, template),
      diagnostics: [],
    };
  }

  static renderTextOrThrow(context: TemplateContext, template: string, path = "text"): string {
    const rendered = this.renderText(context, template, path);

    if (!rendered.ok) {
      throw new TemplateValidationError(rendered.diagnostics);
    }

    return rendered.value;
  }

  static renderJsonOrThrow(
    context: TemplateContext,
    template: JsonValue,
    path = "template",
  ): JsonValue {
    const rendered = this.renderJson(context, template, path);

    if (!rendered.ok) {
      throw new TemplateValidationError(rendered.diagnostics);
    }

    return rendered.value;
  }

  static assertTextTemplateIsValid(template: string, path = "text"): void {
    const diagnostics = this.diagnoseTextTemplate(template, path);

    if (diagnostics.length > 0) {
      throw new TemplateValidationError(diagnostics);
    }
  }

  static assertJsonTemplateIsValid(template: JsonValue, path = "template"): void {
    const diagnostics = this.diagnoseJsonTemplate(template, path);

    if (diagnostics.length > 0) {
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

function diagnosticsForJsonTemplate(value: JsonValue, path: string): TemplateDiagnostic[] {
  if (typeof value === "string") {
    return diagnosticsForTemplateString(value, path);
  }

  if (Array.isArray(value)) {
    return value.flatMap((item, index) => diagnosticsForJsonTemplate(item, `${path}.${index}`));
  }

  if (isJsonObject(value)) {
    return Object.entries(value).flatMap(([key, item]) =>
      diagnosticsForJsonTemplate(item, `${path}.${key}`),
    );
  }

  return [];
}

function diagnosticsForTemplateString(template: string, path: string): TemplateDiagnostic[] {
  return [...template.matchAll(TEMPLATE_VARIABLE_PATTERN)]
    .map((match) => match[1]!)
    .filter((variable) => !isAllowedTemplatePath(variable))
    .map((variable) => ({
      severity: "error" as const,
      path,
      variable,
      message: `Destination template contains unknown variable: ${variable}`,
    }));
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

  return "";
}

function isAllowedTemplatePath(path: string): boolean {
  return isTemplateStaticPath(path) || LABEL_PATH_PATTERN.test(path);
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
