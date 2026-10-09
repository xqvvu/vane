import type { JsonObject } from "@vane/core";

import { parseFeishuResult } from "#destinations/feishu/result";
import type { DestinationTransportContext } from "#destinations/types";
import { Adapter, Send } from "#destinations/utils";

const FEISHU_TENANT_ACCESS_TOKEN_URL =
  "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal";

export type FeishuTenantAccessTokenResult =
  | { ok: true; tenantAccessToken: string; expiresInSeconds: number }
  | { ok: false; errorMessage: string };

/**
 * Exchanges a Feishu self-built app credential for a `tenant_access_token`.
 *
 * Used by the app validation action now, and by app-mode sends and urgent calls
 * later. Returns a structured result so callers can surface the platform's own
 * message instead of an opaque failure, and uses the injected transport context
 * so tests can drive it with a fake fetch.
 */
export async function fetchFeishuTenantAccessToken(
  input: { appId: string; appSecret: string },
  context?: DestinationTransportContext,
): Promise<FeishuTenantAccessTokenResult> {
  const { fetch } = Adapter.getTransportContext(context);

  try {
    const response = await fetch(FEISHU_TENANT_ACCESS_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ app_id: input.appId, app_secret: input.appSecret }),
    });
    const responseBody = await Send.readResponseBody(response);
    const result = parseFeishuResult(responseBody);

    if (!response.ok) {
      return { ok: false, errorMessage: `Feishu returned HTTP ${response.status}` };
    }

    if (!result || result.code !== 0) {
      return { ok: false, errorMessage: feishuErrorMessage(result) };
    }

    const token = result.tenant_access_token;

    if (typeof token !== "string" || token.length === 0) {
      return {
        ok: false,
        errorMessage: "Feishu tenant access token response was missing the token",
      };
    }

    return {
      ok: true,
      tenantAccessToken: token,
      expiresInSeconds: typeof result.expire === "number" ? result.expire : 0,
    };
  } catch (error) {
    return {
      ok: false,
      errorMessage:
        error instanceof Error && error.message.trim()
          ? `Feishu tenant access token request failed: ${error.message}`
          : "Feishu tenant access token request failed",
    };
  }
}

function feishuErrorMessage(result: JsonObject | null): string {
  if (!result) {
    return "Feishu returned an unreadable tenant access token response";
  }

  const code = result.code ?? result.StatusCode;
  const codeText = typeof code === "string" || typeof code === "number" ? String(code) : "unknown";
  const message = typeof result.msg === "string" && result.msg.trim() ? result.msg.trim() : null;

  return message
    ? `Feishu returned code ${codeText}: ${message}`
    : `Feishu returned code ${codeText}`;
}
