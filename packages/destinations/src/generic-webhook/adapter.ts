import {
  destinationSendFailed,
  destinationSendSucceeded,
  readResponseBody,
  retryHintForHttpStatus,
  transportFailureResult,
} from "#/send-result.ts";
import { defineDestinationAdapter, resolveDestinationTransportContext } from "#/types.ts";

import { genericWebhookManifest } from "./manifest.ts";
import { renderGenericWebhookPayload } from "./payload.ts";
import { GenericWebhookConfigSchema } from "./schema.ts";

export const genericWebhookAdapter = defineDestinationAdapter({
  manifest: genericWebhookManifest,
  configSchema: GenericWebhookConfigSchema,
  preview(input) {
    const config = GenericWebhookConfigSchema.parse(input.config);

    return renderGenericWebhookPayload({ ...input, config });
  },
  async send(input, context) {
    const config = GenericWebhookConfigSchema.parse(input.config);
    const { fetch } = resolveDestinationTransportContext(context);
    const renderedPayload = renderGenericWebhookPayload({ ...input, config });

    try {
      const response = await fetch(config.url, {
        method: config.method,
        headers: {
          "Content-Type": "application/json",
          ...config.headers,
        },
        body: JSON.stringify(renderedPayload),
      });
      const responseBody = await readResponseBody(response);

      if (response.ok) {
        return destinationSendSucceeded({
          statusCode: response.status,
          responseBody,
          renderedPayload,
        });
      }

      return destinationSendFailed({
        errorKind: "http_error",
        retryHint: retryHintForHttpStatus(response.status),
        errorMessage: `Generic webhook returned HTTP ${response.status}`,
        statusCode: response.status,
        responseBody,
        renderedPayload,
      });
    } catch (error) {
      return transportFailureResult({ error, renderedPayload });
    }
  },
});

export const genericWebhookSender = genericWebhookAdapter;
