import { Adapter, R, Send } from "#/utils.ts";

import { slackManifest } from "#/slack/manifest.ts";
import { renderSlackPayload } from "#/slack/payload.ts";
import { SlackConfigSchema } from "#/slack/schema.ts";

export const slackAdapter = Adapter.define({
  manifest: slackManifest,
  configSchema: SlackConfigSchema,
  preview(input) {
    const config = SlackConfigSchema.parse(input.config);

    return renderSlackPayload({ ...input, config });
  },
  async send(input, context) {
    const config = SlackConfigSchema.parse(input.config);
    const { fetch } = Adapter.getTransportContext(context);
    const renderedPayload = renderSlackPayload({ ...input, config });

    try {
      const response = await fetch(config.webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(renderedPayload),
      });
      const responseBody = await Send.readResponseBody(response);
      const slackOk = responseBody.trim().toLocaleLowerCase() === "ok";

      if (response.ok && slackOk) {
        return R.ok({
          statusCode: response.status,
          responseBody,
          renderedPayload,
        });
      }

      return R.fail({
        errorKind: response.ok ? "target_rejected" : "http_error",
        retryHint: response.ok ? "not_retryable" : Send.httpStatusToRetryHint(response.status),
        errorMessage: response.ok
          ? `Slack webhook returned ${responseBody || "an unexpected response"}`
          : `Slack webhook returned HTTP ${response.status}`,
        statusCode: response.status,
        responseBody,
        renderedPayload,
      });
    } catch (error) {
      return Send.transportFailureResult({ error, renderedPayload });
    }
  },
});

export const slackSender = slackAdapter;
