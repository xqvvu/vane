import type { JsonValue } from "@vane/core";
import { z } from "zod";

import type { DestinationSendInput, DestinationSender, FetchLike } from "#/types.ts";

export const GenericWebhookConfigSchema = z.object({
  url: z.url(),
  method: z.enum(["POST", "PUT", "PATCH"]).default("POST"),
  headers: z.record(z.string(), z.string()).default({}),
});

export type GenericWebhookConfig = z.infer<typeof GenericWebhookConfigSchema>;

export const genericWebhookSender: DestinationSender<GenericWebhookConfig> = {
  kind: "generic_webhook",
  configSchema: GenericWebhookConfigSchema,
  async send(input, context) {
    const config = GenericWebhookConfigSchema.parse(input.config);
    const fetcher = context?.fetch ?? getGlobalFetch();
    const renderedPayload = renderGenericWebhookPayload(input);
    const response = await fetcher(config.url, {
      method: config.method,
      headers: {
        "Content-Type": "application/json",
        ...config.headers,
      },
      body: JSON.stringify(renderedPayload),
    });
    const responseBody = await readResponseBody(response);

    return {
      success: response.ok,
      statusCode: response.status,
      responseBody,
      error: response.ok ? null : `Generic webhook returned HTTP ${response.status}`,
      renderedPayload,
    };
  },
};

export function renderGenericWebhookPayload(input: DestinationSendInput<GenericWebhookConfig>): JsonValue {
  return {
    eventId: input.eventId,
    source: {
      id: input.source.id,
      name: input.source.name,
      provider: input.source.provider,
    },
    destination: {
      id: input.destination.id,
      name: input.destination.name,
      kind: input.destination.kind,
    },
    alert: input.normalizedEvent,
  };
}

function getGlobalFetch(): FetchLike {
  if (!globalThis.fetch) {
    throw new Error("No fetch implementation is available for generic webhook delivery");
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
