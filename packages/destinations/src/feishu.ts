import type { JsonObject, JsonValue } from "@vane/core";
import { z } from "zod";

import { MessageTemplateSchema, renderMessageTemplate } from "#/template.ts";
import type { DestinationSendInput, DestinationSender, FetchLike } from "#/types.ts";

export const FeishuConfigSchema = z.object({
  webhookUrl: z.url(),
  signSecret: z.string().min(1).optional(),
  messageTemplate: MessageTemplateSchema,
});

export type FeishuConfig = z.infer<typeof FeishuConfigSchema>;

export const feishuSender: DestinationSender<FeishuConfig> = {
  kind: "feishu",
  configSchema: FeishuConfigSchema,
  preview(input) {
    const config = FeishuConfigSchema.parse(input.config);

    return renderFeishuTextPayload(input, {
      ...config,
      signSecret: undefined,
    });
  },
  async send(input, context) {
    const config = FeishuConfigSchema.parse(input.config);
    const fetcher = context?.fetch ?? getGlobalFetch();
    const signedPayload = await renderFeishuTextPayload(input, config);
    const renderedPayload = await renderFeishuTextPayload(input, {
      ...config,
      signSecret: undefined,
    });
    const response = await fetcher(config.webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(signedPayload),
    });
    const responseBody = await readResponseBody(response);
    const feishuResult = parseFeishuResult(responseBody);
    const feishuOk = feishuResult ? isFeishuSuccess(feishuResult) : response.ok;
    const success = response.ok && feishuOk;

    return {
      success,
      statusCode: response.status,
      responseBody,
      error: success
        ? null
        : feishuResult
          ? `Feishu returned code ${feishuCode(feishuResult)}`
          : `Feishu webhook returned HTTP ${response.status}`,
      renderedPayload,
    };
  },
};

export async function renderFeishuTextPayload(
  input: DestinationSendInput<FeishuConfig>,
  config: FeishuConfig,
): Promise<JsonValue> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const payload: JsonObject = {
    msg_type: "text",
    content: {
      text: renderFeishuText(input, config),
    },
  };

  if (config.signSecret) {
    payload.timestamp = timestamp;
    payload.sign = await createFeishuSign(timestamp, config.signSecret);
  }

  return payload;
}

export async function createFeishuSign(timestamp: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(`${timestamp}\n${secret}`),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new Uint8Array());

  return bytesToBase64(new Uint8Array(signature));
}

function renderFeishuText(input: DestinationSendInput<FeishuConfig>, config: FeishuConfig): string {
  const event = input.normalizedEvent;
  const templated = renderMessageTemplate(input, config.messageTemplate);

  if (templated) {
    return templated;
  }

  const labelText = Object.entries(event.labels)
    .map(([key, value]) => `${key}=${value}`)
    .join(", ");

  return [
    `[${event.severity.toUpperCase()}] ${event.title}`,
    event.message,
    `Status: ${event.status}`,
    `Source: ${input.source.name}`,
    labelText ? `Labels: ${labelText}` : null,
    `Fingerprint: ${event.fingerprint}`,
    `Occurred at: ${event.occurredAt}`,
    `Event ID: ${input.eventId}`,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
}

function parseFeishuResult(responseBody: string): JsonObject | null {
  try {
    const parsed = JSON.parse(responseBody) as unknown;
    return isJsonObject(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function isFeishuSuccess(result: JsonObject): boolean {
  return result.code === 0 || result.StatusCode === 0 || result.msg === "success";
}

function feishuCode(result: JsonObject): string {
  const code = result.code ?? result.StatusCode;
  return typeof code === "string" || typeof code === "number" ? String(code) : "unknown";
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getGlobalFetch(): FetchLike {
  if (!globalThis.fetch) {
    throw new Error("No fetch implementation is available for Feishu delivery");
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

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}
