import type { JsonValue } from "@vane/core";

import type {
  DestinationErrorKind,
  DestinationRetryHint,
  DestinationSendResult,
  FetchLikeResponse,
} from "#/types.ts";

export function destinationSendSucceeded(input: {
  statusCode: number | null;
  responseBody: string | null;
  renderedPayload: JsonValue;
}): DestinationSendResult {
  return {
    ok: true,
    statusCode: input.statusCode,
    responseBody: input.responseBody,
    renderedPayload: input.renderedPayload,
  };
}

export function destinationSendFailed(input: {
  errorKind: DestinationErrorKind;
  retryHint: DestinationRetryHint;
  errorMessage: string;
  statusCode: number | null;
  responseBody: string | null;
  renderedPayload: JsonValue;
}): DestinationSendResult {
  return {
    ok: false,
    errorKind: input.errorKind,
    retryHint: input.retryHint,
    errorMessage: input.errorMessage,
    statusCode: input.statusCode,
    responseBody: input.responseBody,
    renderedPayload: input.renderedPayload,
  };
}

export function retryHintForHttpStatus(status: number): DestinationRetryHint {
  if (status === 408 || status === 409 || status === 425 || status === 429 || status >= 500) {
    return "retryable";
  }

  return "not_retryable";
}

export function transportFailureResult(input: {
  error: unknown;
  renderedPayload: JsonValue;
}): DestinationSendResult {
  return destinationSendFailed({
    errorKind: "network_error",
    retryHint: "retryable",
    errorMessage: safeTransportErrorMessage(input.error),
    statusCode: null,
    responseBody: null,
    renderedPayload: input.renderedPayload,
  });
}

export async function readResponseBody(response: Pick<FetchLikeResponse, "text">): Promise<string> {
  try {
    return await response.text();
  } catch {
    return "";
  }
}

function safeTransportErrorMessage(error: unknown): string {
  return error instanceof Error && error.message.trim()
    ? `Destination transport failed: ${error.message}`
    : "Destination transport failed";
}
