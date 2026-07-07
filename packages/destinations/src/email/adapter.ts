import { Adapter, R, Send } from "#/utils.ts";

import { emailManifest } from "#/email/manifest.ts";
import { renderEmailPayload, renderEmailRequestPayload } from "#/email/payload.ts";
import { EmailConfigSchema } from "#/email/schema.ts";

export const emailAdapter = Adapter.define({
  manifest: emailManifest,
  configSchema: EmailConfigSchema,
  preview(input) {
    const config = EmailConfigSchema.parse(input.config);

    return renderEmailPayload({ ...input, config }, config);
  },
  async send(input, context) {
    const config = EmailConfigSchema.parse(input.config);
    const { fetch } = Adapter.getTransportContext(context);
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
      const responseBody = await Send.readResponseBody(response);

      if (response.ok) {
        return R.ok({ statusCode: response.status, responseBody, renderedPayload });
      }

      return R.fail({
        errorKind: "http_error",
        retryHint: Send.httpStatusToRetryHint(response.status),
        errorMessage: `Email gateway returned HTTP ${response.status}`,
        statusCode: response.status,
        responseBody,
        renderedPayload,
      });
    } catch (error) {
      return Send.transportFailureResult({ error, renderedPayload });
    }
  },
});

export const emailSender = emailAdapter;
