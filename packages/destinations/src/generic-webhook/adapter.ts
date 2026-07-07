import { genericWebhookManifest } from "#/generic-webhook/manifest.ts";
import { renderGenericWebhookPayload } from "#/generic-webhook/payload.ts";
import { GenericWebhookConfigSchema } from "#/generic-webhook/schema.ts";
import { Adapter, R, Send } from "#/utils.ts";

export const genericWebhookAdapter = Adapter.define({
  manifest: genericWebhookManifest,
  configSchema: GenericWebhookConfigSchema,
  preview(input) {
    const config = GenericWebhookConfigSchema.parse(input.config);

    return renderGenericWebhookPayload({ ...input, config });
  },
  async send(input, context) {
    const config = GenericWebhookConfigSchema.parse(input.config);
    const { fetch } = Adapter.getTransportContext(context);
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
      const responseBody = await Send.readResponseBody(response);

      if (response.ok) {
        return R.ok({
          statusCode: response.status,
          responseBody,
          renderedPayload,
        });
      }

      return R.fail({
        errorKind: "http_error",
        retryHint: Send.httpStatusToRetryHint(response.status),
        errorMessage: `Generic webhook returned HTTP ${response.status}`,
        statusCode: response.status,
        responseBody,
        renderedPayload,
      });
    } catch (error) {
      return Send.transportFailureResult({ error, renderedPayload });
    }
  },
});

export const genericWebhookSender = genericWebhookAdapter;
