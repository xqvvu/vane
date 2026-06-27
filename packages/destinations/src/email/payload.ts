import type { JsonValue } from "@vane/core";

import { createTemplateContext, renderTextTemplateOrThrow } from "#/template.ts";
import type { DestinationSendInput } from "#/types.ts";

import type { EmailConfig } from "./schema.ts";

export function renderEmailPayload(
  input: DestinationSendInput<EmailConfig>,
  config: EmailConfig,
): JsonValue {
  const event = input.normalizedEvent;
  const subjectPrefix = config.subjectPrefix ? `${config.subjectPrefix.trim()} ` : "";
  const subject = `${subjectPrefix}[${event.severity.toUpperCase()} ${event.status}] ${event.title}`;
  const text =
    config.template?.mode === "text"
      ? renderTextTemplateOrThrow(createTemplateContext(input), config.template.text)
      : renderEmailText(input);
  return {
    subject,
    text,
    html: renderEmailHtml(text),
    metadata: {
      eventId: input.eventId,
      sourceId: input.source.id,
      destinationId: input.destination.id,
      fingerprint: event.fingerprint,
      severity: event.severity,
      status: event.status,
    },
  };
}

export function renderEmailRequestPayload(
  input: DestinationSendInput<EmailConfig>,
  config: EmailConfig,
): JsonValue {
  const payload: {
    to: string[];
    from: string;
    replyTo?: string;
    subject: string;
    text: string;
    html: string;
    metadata: Record<string, string>;
  } = {
    ...(renderEmailPayload(input, config) as {
      subject: string;
      text: string;
      html: string;
      metadata: Record<string, string>;
    }),
    to: config.to,
    from: config.from,
  };

  if (config.replyTo) {
    payload.replyTo = config.replyTo;
  }

  return payload;
}

function renderEmailText(input: DestinationSendInput<EmailConfig>): string {
  const event = input.normalizedEvent;
  const labelText = Object.entries(event.labels)
    .map(([key, value]) => `${key}=${value}`)
    .join(", ");

  return [
    `[${event.severity.toUpperCase()} ${event.status}] ${event.title}`,
    "",
    event.message,
    "",
    `Source: ${input.source.name}`,
    `Fingerprint: ${event.fingerprint}`,
    `Occurred at: ${event.occurredAt}`,
    `Event ID: ${input.eventId}`,
    labelText ? `Labels: ${labelText}` : null,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
}

function renderEmailHtml(text: string): string {
  return `<pre>${escapeHtml(text)}</pre>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
