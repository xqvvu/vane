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

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
