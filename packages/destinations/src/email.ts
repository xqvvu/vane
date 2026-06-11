import type { JsonValue } from "@vane/core";
import { z } from "zod";

import { MessageTemplateSchema, renderMessageTemplate } from "#/template.ts";
import type { DestinationSendInput, DestinationSender, FetchLike } from "#/types.ts";

export const EmailConfigSchema = z.object({
  endpointUrl: z.url(),
  to: z.array(z.email()).min(1),
  from: z.email(),
  replyTo: z.email().optional(),
  subjectPrefix: z.string().trim().optional(),
  headers: z.record(z.string(), z.string()).default({}),
  messageTemplate: MessageTemplateSchema,
});

export type EmailConfig = z.infer<typeof EmailConfigSchema>;

export const emailSender: DestinationSender<EmailConfig> = {
  kind: "email",
  configSchema: EmailConfigSchema,
  preview(input) {
    const config = EmailConfigSchema.parse(input.config);

    return renderEmailPayload({ ...input, config }, config);
  },
  async send(input, context) {
    const config = EmailConfigSchema.parse(input.config);
    const fetcher = context?.fetch ?? getGlobalFetch();
    const renderedPayload = renderEmailPayload(input, config);
    const requestPayload = renderEmailRequestPayload(input, config);
    const response = await fetcher(config.endpointUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...config.headers,
      },
      body: JSON.stringify(requestPayload),
    });
    const responseBody = await readResponseBody(response);

    return {
      success: response.ok,
      statusCode: response.status,
      responseBody,
      error: response.ok ? null : `Email gateway returned HTTP ${response.status}`,
      renderedPayload,
    };
  },
};

export function renderEmailPayload(
  input: DestinationSendInput<EmailConfig>,
  config: EmailConfig,
): JsonValue {
  const event = input.normalizedEvent;
  const subjectPrefix = config.subjectPrefix ? `${config.subjectPrefix.trim()} ` : "";
  const subject = `${subjectPrefix}[${event.severity.toUpperCase()} ${event.status}] ${event.title}`;
  const text = renderMessageTemplate(input, config.messageTemplate) ?? renderEmailText(input);
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

function renderEmailRequestPayload(
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

function getGlobalFetch(): FetchLike {
  if (!globalThis.fetch) {
    throw new Error("No fetch implementation is available for email delivery");
  }

  return globalThis.fetch;
}

async function readResponseBody(response: { text(): Promise<string> }): Promise<string> {
  try {
    return await response.text();
  } catch {
    return "";
  }
}
