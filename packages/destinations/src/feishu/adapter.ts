import type { JsonValue } from "@vane/core";
import { z } from "zod";

import {
  destinationSendFailed,
  destinationSendSucceeded,
  readResponseBody,
  retryHintForHttpStatus,
  transportFailureResult,
} from "#/send-result.ts";
import { isTemplateValidationError, templateErrorPayload } from "#/template.ts";
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
    const parsedConfig = FeishuConfigSchema.safeParse(input.config);

    if (!parsedConfig.success) {
      return destinationSendFailed({
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
    const { fetch, now } = resolveDestinationTransportContext(context);
    let renderedPayload: JsonValue;
    let signedPayload: JsonValue;

    try {
      renderedPayload = renderFeishuPreviewPayload(input, config);
      signedPayload = await renderFeishuWirePayload(input, config, now);
    } catch (error) {
      if (isTemplateValidationError(error)) {
        return destinationSendFailed({
          errorKind: "configuration_error",
          retryHint: "not_retryable",
          errorMessage: error.message,
          statusCode: null,
          responseBody: null,
          renderedPayload: templateErrorPayload(error),
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
