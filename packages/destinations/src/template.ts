import { z } from "zod";

import type { DestinationSendInput } from "#/types.ts";

const TEMPLATE_VARIABLE_PATTERN = /\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g;
const AllowedTemplatePaths = new Set([
  "eventId",
  "source.id",
  "source.name",
  "source.provider",
  "destination.id",
  "destination.name",
  "destination.kind",
  "event.title",
  "event.message",
  "event.severity",
  "event.status",
  "event.fingerprint",
  "event.occurredAt",
]);

export const MessageTemplateSchema = z
  .string()
  .trim()
  .min(1)
  .max(2000)
  .refine((template) => unknownTemplatePaths(template).length === 0, {
    message: "Message template contains unknown variables",
  })
  .optional();

export function renderMessageTemplate(
  input: DestinationSendInput<unknown>,
  template: string | undefined,
): string | null {
  if (!template?.trim()) {
    return null;
  }

  return template.replaceAll(TEMPLATE_VARIABLE_PATTERN, (_match, rawPath: string) =>
    templateValue(input, rawPath),
  );
}

function templateValue(input: DestinationSendInput<unknown>, path: string): string {
  if (path === "eventId") {
    return input.eventId;
  }

  if (path === "source.id") {
    return input.source.id;
  }

  if (path === "source.name") {
    return input.source.name;
  }

  if (path === "source.provider") {
    return input.source.provider;
  }

  if (path === "destination.id") {
    return input.destination.id;
  }

  if (path === "destination.name") {
    return input.destination.name;
  }

  if (path === "destination.kind") {
    return input.destination.kind;
  }

  if (path === "event.title") {
    return input.normalizedEvent.title;
  }

  if (path === "event.message") {
    return input.normalizedEvent.message;
  }

  if (path === "event.severity") {
    return input.normalizedEvent.severity;
  }

  if (path === "event.status") {
    return input.normalizedEvent.status;
  }

  if (path === "event.fingerprint") {
    return input.normalizedEvent.fingerprint;
  }

  if (path === "event.occurredAt") {
    return input.normalizedEvent.occurredAt;
  }

  const labelMatch = /^event\.labels\.([a-zA-Z0-9_.-]+)$/.exec(path);

  if (labelMatch) {
    return input.normalizedEvent.labels[labelMatch[1]!] ?? "";
  }

  return "";
}

function unknownTemplatePaths(template: string): string[] {
  return [...template.matchAll(TEMPLATE_VARIABLE_PATTERN)]
    .map((match) => match[1]!)
    .filter((path) => !AllowedTemplatePaths.has(path) && !isAllowedLabelPath(path));
}

function isAllowedLabelPath(path: string): boolean {
  return /^event\.labels\.[a-zA-Z0-9_.-]+$/.test(path);
}
