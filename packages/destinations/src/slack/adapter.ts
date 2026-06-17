import {
  destinationSendFailed,
  destinationSendSucceeded,
  readResponseBody,
  retryHintForHttpStatus,
  transportFailureResult,
} from "#/send-result.ts";
import { defineDestinationAdapter, resolveDestinationTransportContext } from "#/types.ts";

import { slackManifest } from "./manifest.ts";
import { renderSlackPayload } from "./payload.ts";
import { SlackConfigSchema } from "./schema.ts";

export const slackAdapter = defineDestinationAdapter({
  manifest: slackManifest,
  configSchema: SlackConfigSchema,
  preview(input) {
    const config = SlackConfigSchema.parse(input.config);

    return renderSlackPayload({ ...input, config });
  },
  async send(input, context) {
    const config = SlackConfigSchema.parse(input.config);
    const { fetch } = resolveDestinationTransportContext(context);
    const renderedPayload = renderSlackPayload({ ...input, config });

    try {
      const response = await fetch(config.webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(renderedPayload),
      });
      const responseBody = await readResponseBody(response);
      const slackOk = responseBody.trim().toLocaleLowerCase() === "ok";

      if (response.ok && slackOk) {
        return destinationSendSucceeded({
          statusCode: response.status,
          responseBody,
          renderedPayload,
        });
      }

      return destinationSendFailed({
        errorKind: response.ok ? "target_rejected" : "http_error",
        retryHint: response.ok ? "not_retryable" : retryHintForHttpStatus(response.status),
        errorMessage: response.ok
          ? `Slack webhook returned ${responseBody || "an unexpected response"}`
          : `Slack webhook returned HTTP ${response.status}`,
        statusCode: response.status,
        responseBody,
        renderedPayload,
      });
    } catch (error) {
      return transportFailureResult({ error, renderedPayload });
    }
  },
});

export const slackSender = slackAdapter;
