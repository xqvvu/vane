import type { JsonValue } from "@vane/core";
import { z } from "zod";

import { DestinationTemplateEngine } from "#/template.ts";
import { Adapter, R, Send } from "#/utils.ts";

import { feishuManifest } from "#/feishu/manifest.ts";
import { renderFeishuPreviewPayload, renderFeishuWirePayload } from "#/feishu/payload.ts";
import { feishuCode, isFeishuSuccess, parseFeishuResult } from "#/feishu/result.ts";
import { FeishuConfigSchema } from "#/feishu/schema.ts";

export const feishuAdapter = Adapter.define({
  manifest: feishuManifest,
  configSchema: FeishuConfigSchema,
  preview(input) {
    const config = FeishuConfigSchema.parse(input.config);

    return renderFeishuPreviewPayload(input, config);
  },
  async send(input, context) {
    const parsedConfig = FeishuConfigSchema.safeParse(input.config);

    if (!parsedConfig.success) {
      return R.fail({
        errorKind: "configuration_error",
        retryHint: "not_retryable",
        errorMessage: "Feishu destination template configuration is invalid",
        statusCode: null,
        responseBody: null,
        renderedPayload: {
          templateError: {
            diagnostics: zodTemplateDiagnostics(parsedConfig.error),
          },
        },
      });
    }

    const config = parsedConfig.data;
    const { fetch, now } = Adapter.getTransportContext(context);
    let renderedPayload: JsonValue;
    let signedPayload: JsonValue;

    try {
      renderedPayload = renderFeishuPreviewPayload(input, config);
      signedPayload = await renderFeishuWirePayload(input, config, now);
    } catch (error) {
      if (DestinationTemplateEngine.isValidationError(error)) {
        return R.fail({
          errorKind: "configuration_error",
          retryHint: "not_retryable",
          errorMessage: error.message,
          statusCode: null,
          responseBody: null,
          renderedPayload: DestinationTemplateEngine.validationErrorToPayload(error),
        });
      }

      throw error;
    }

    try {
      const response = await fetch(config.webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(signedPayload),
      });
      const responseBody = await Send.readResponseBody(response);
      const feishuResult = parseFeishuResult(responseBody);
      const feishuOk = feishuResult ? isFeishuSuccess(feishuResult) : response.ok;

      if (response.ok && feishuOk) {
        return R.ok({
          statusCode: response.status,
          responseBody,
          renderedPayload,
        });
      }

      return R.fail({
        errorKind: response.ok ? "target_rejected" : "http_error",
        retryHint: response.ok ? "not_retryable" : Send.httpStatusToRetryHint(response.status),
        errorMessage: feishuResult
          ? `Feishu returned code ${feishuCode(feishuResult)}`
          : `Feishu webhook returned HTTP ${response.status}`,
        statusCode: response.status,
        responseBody,
        renderedPayload,
      });
    } catch (error) {
      return Send.transportFailureResult({ error, renderedPayload });
    }
  },
});

export const feishuSender = feishuAdapter;

function zodTemplateDiagnostics(error: z.ZodError) {
  return error.issues.map((issue) => ({
    severity: "error",
    path: issue.path.join(".") || null,
    variable: variableFromTemplateIssue(issue.message),
    message: issue.message,
  }));
}

function variableFromTemplateIssue(message: string): string | null {
  const match = /^Destination template contains unknown variable: (.+)$/.exec(message);

  return match?.[1] ?? null;
}
