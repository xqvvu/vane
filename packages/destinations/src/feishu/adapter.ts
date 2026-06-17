import {
  destinationSendFailed,
  destinationSendSucceeded,
  readResponseBody,
  retryHintForHttpStatus,
  transportFailureResult,
} from "#/send-result.ts";
import { defineDestinationAdapter, resolveDestinationTransportContext } from "#/types.ts";

import { feishuManifest } from "./manifest.ts";
import { renderFeishuPreviewPayload, renderFeishuWirePayload } from "./payload.ts";
import { feishuCode, isFeishuSuccess, parseFeishuResult } from "./result.ts";
import { FeishuConfigSchema } from "./schema.ts";

export const feishuAdapter = defineDestinationAdapter({
  manifest: feishuManifest,
  configSchema: FeishuConfigSchema,
  preview(input) {
    const config = FeishuConfigSchema.parse(input.config);

    return renderFeishuPreviewPayload(input, config);
  },
  async send(input, context) {
    const config = FeishuConfigSchema.parse(input.config);
    const { fetch, now } = resolveDestinationTransportContext(context);
    const renderedPayload = renderFeishuPreviewPayload(input, config);
    const signedPayload = await renderFeishuWirePayload(input, config, now);

    try {
      const response = await fetch(config.webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(signedPayload),
      });
      const responseBody = await readResponseBody(response);
      const feishuResult = parseFeishuResult(responseBody);
      const feishuOk = feishuResult ? isFeishuSuccess(feishuResult) : response.ok;

      if (response.ok && feishuOk) {
        return destinationSendSucceeded({
          statusCode: response.status,
          responseBody,
          renderedPayload,
        });
      }

      return destinationSendFailed({
        errorKind: response.ok ? "target_rejected" : "http_error",
        retryHint: response.ok ? "not_retryable" : retryHintForHttpStatus(response.status),
        errorMessage: feishuResult
          ? `Feishu returned code ${feishuCode(feishuResult)}`
          : `Feishu webhook returned HTTP ${response.status}`,
        statusCode: response.status,
        responseBody,
        renderedPayload,
      });
    } catch (error) {
      return transportFailureResult({ error, renderedPayload });
    }
  },
});

export const feishuSender = feishuAdapter;
