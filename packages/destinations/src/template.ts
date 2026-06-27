import { z } from "zod";

import { JsonObjectSchema } from "@vane/core";
import type { DestinationSummary, JsonObject, JsonValue, SourceSummary } from "@vane/core";

import type { DestinationSendInput } from "#/types.ts";

const TEMPLATE_VARIABLE_PATTERN = /\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g;
const LABEL_PATH_PATTERN = /^event\.labels\.([a-zA-Z0-9_.-]+)$/;

const AllowedTemplatePaths = new Set([
  "event.id",
  "event.title",
  "event.message",
  "event.severity",
  "event.status",
  "event.fingerprint",
  "event.occurredAt",
  "source.id",
  "source.name",
  "source.provider",
  "destination.id",
  "destination.name",
  "destination.kind",
  "vane.eventUrl",
]);

export const TextDestinationTemplateSchema = z
  .strictObject({
    mode: z.literal("text"),
    text: z.string().trim().min(1).max(4000),
  })
  .superRefine((template, context) => {
    for (const diagnostic of diagnosticsForTemplateString(template.text, "template.text")) {
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
    for (const diagnostic of diagnosticsForJsonTemplate(template.card, "template.card")) {
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

export function createTemplateContext(
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

export function renderTextTemplate(
  context: TemplateContext,
  template: string,
  path = "text",
): RenderTemplateResult<string> {
  const diagnostics = diagnosticsForTemplateString(template, path);

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

export function renderJsonTemplate(
  context: TemplateContext,
  template: JsonValue,
  path = "template",
): RenderTemplateResult<JsonValue> {
  const diagnostics = diagnosticsForJsonTemplate(template, path);

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

export function assertValidTextTemplate(template: string, path = "text"): void {
  const diagnostics = diagnosticsForTemplateString(template, path);

  if (diagnostics.length > 0) {
    throw new TemplateValidationError(diagnostics);
  }
}

export function renderTextTemplateOrThrow(
  context: TemplateContext,
  template: string,
  path = "text",
): string {
  const rendered = renderTextTemplate(context, template, path);

  if (!rendered.ok) {
    throw new TemplateValidationError(rendered.diagnostics);
  }

  return rendered.value;
}

export function assertValidJsonTemplate(template: JsonValue, path = "template"): void {
  const diagnostics = diagnosticsForJsonTemplate(template, path);

  if (diagnostics.length > 0) {
    throw new TemplateValidationError(diagnostics);
  }
}

export function templateDiagnostics(template: JsonValue | string, path = "template") {
  return typeof template === "string"
    ? diagnosticsForTemplateString(template, path)
    : diagnosticsForJsonTemplate(template, path);
}

export function isTemplateValidationError(error: unknown): error is TemplateValidationError {
  return error instanceof TemplateValidationError;
}

export function templateErrorPayload(error: TemplateValidationError): JsonObject {
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
  if (path === "event.id") {
    return context.event.id;
  }

  if (path === "event.title") {
    return context.event.title;
  }

  if (path === "event.message") {
    return context.event.message;
  }

  if (path === "event.severity") {
    return context.event.severity;
  }

  if (path === "event.status") {
    return context.event.status;
  }

  if (path === "event.fingerprint") {
    return context.event.fingerprint;
  }

  if (path === "event.occurredAt") {
    return context.event.occurredAt;
  }

  if (path === "source.id") {
    return context.source.id;
  }

  if (path === "source.name") {
    return context.source.name;
  }

  if (path === "source.provider") {
    return context.source.provider;
  }

  if (path === "destination.id") {
    return context.destination.id;
  }

  if (path === "destination.name") {
    return context.destination.name;
  }

  if (path === "destination.kind") {
    return context.destination.kind;
  }

  if (path === "vane.eventUrl") {
    return context.vane.eventUrl;
  }

  const labelMatch = LABEL_PATH_PATTERN.exec(path);

  if (labelMatch) {
    return context.event.labels[labelMatch[1]!] ?? "";
  }

  return "";
}

function isAllowedTemplatePath(path: string): boolean {
  return AllowedTemplatePaths.has(path) || LABEL_PATH_PATTERN.test(path);
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
