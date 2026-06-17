import {
  destinationSendFailed,
  destinationSendSucceeded,
  readResponseBody,
  retryHintForHttpStatus,
  transportFailureResult,
} from "#/send-result.ts";
import { defineDestinationAdapter, resolveDestinationTransportContext } from "#/types.ts";

import { emailManifest } from "./manifest.ts";
import { renderEmailPayload, renderEmailRequestPayload } from "./payload.ts";
import { EmailConfigSchema } from "./schema.ts";

export const emailAdapter = defineDestinationAdapter({
  manifest: emailManifest,
  configSchema: EmailConfigSchema,
  preview(input) {
    const config = EmailConfigSchema.parse(input.config);

    return renderEmailPayload({ ...input, config }, config);
  },
  async send(input, context) {
    const config = EmailConfigSchema.parse(input.config);
    const { fetch } = resolveDestinationTransportContext(context);
    const renderedPayload = renderEmailPayload(input, config);
    const requestPayload = renderEmailRequestPayload(input, config);

    try {
      const response = await fetch(config.endpointUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...config.headers,
        },
        body: JSON.stringify(requestPayload),
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
        errorMessage: `Email gateway returned HTTP ${response.status}`,
        statusCode: response.status,
        responseBody,
        renderedPayload,
      });
    } catch (error) {
      return transportFailureResult({ error, renderedPayload });
    }
  },
});

export const emailSender = emailAdapter;
