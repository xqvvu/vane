import type { JsonObject } from "@vane/core";

export function parseFeishuResult(responseBody: string): JsonObject | null {
  try {
    const parsed = JSON.parse(responseBody) as unknown;
    return isJsonObject(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function isFeishuSuccess(result: JsonObject): boolean {
  return result.code === 0 || result.StatusCode === 0 || result.msg === "success";
}

export function feishuCode(result: JsonObject): string {
  const code = result.code ?? result.StatusCode;
  return typeof code === "string" || typeof code === "number" ? String(code) : "unknown";
}

/**
 * Builds a readable message for a Feishu business rejection (`code !== 0`).
 *
 * Shared by the token client and the urgent phone client so platform
 * rejections surface the platform's own code and message instead of an opaque
 * failure.
 */
export function feishuFailureMessage(result: JsonObject | null, fallback: string): string {
  if (!result) {
    return fallback;
  }

  const code = result.code ?? result.StatusCode;
  const codeText = typeof code === "string" || typeof code === "number" ? String(code) : "unknown";
  const message = typeof result.msg === "string" && result.msg.trim() ? result.msg.trim() : null;

  return message
    ? `Feishu returned code ${codeText}: ${message}`
    : `Feishu returned code ${codeText}`;
}

/**
 * Reads `data.message_id` from a Feishu send-message response.
 *
 * This is the handle a follow-up urgent call acts on, so callers keep it as the
 * delivery's provider reference.
 */
export function feishuMessageId(result: JsonObject | null): string | null {
  if (!result) {
    return null;
  }

  const data = result.data;

  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return null;
  }

  const messageId = (data as JsonObject).message_id;

  return typeof messageId === "string" && messageId.length > 0 ? messageId : null;
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
