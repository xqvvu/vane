import { feishuFailureMessage, parseFeishuResult } from "#destinations/shared/feishu-result";
import type {
  DestinationErrorKind,
  DestinationRetryHint,
  DestinationTransportContext,
} from "#destinations/types";
import { Adapter, Send } from "#destinations/utils";

const FEISHU_TENANT_ACCESS_TOKEN_URL =
  "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal";

export type FeishuTenantAccessTokenResult =
  | { ok: true; tenantAccessToken: string; expiresInSeconds: number }
  | {
      ok: false;
      errorKind: DestinationErrorKind;
      retryHint: DestinationRetryHint;
      errorMessage: string;
      statusCode: number | null;
      responseBody: string | null;
    };

/**
 * Exchanges a Feishu self-built app credential for a `tenant_access_token`.
 *
 * Shared by the app validation action and the urgency channels. Returns a
 * structured result so callers can surface the platform's own message and keep
 * retry discipline, and uses the injected transport context so tests can drive
 * it with a fake fetch.
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
      return {
        ok: false,
        errorKind: "http_error",
        retryHint: Send.httpStatusToRetryHint(response.status),
        errorMessage: `Feishu returned HTTP ${response.status}`,
        statusCode: response.status,
        responseBody,
      };
    }

    if (!result || result.code !== 0) {
      return {
        ok: false,
        errorKind: "target_rejected",
        retryHint: "not_retryable",
        errorMessage: feishuFailureMessage(
          result,
          "Feishu returned an unreadable tenant access token response",
        ),
        statusCode: response.status,
        responseBody,
      };
    }

    const token = result.tenant_access_token;

    if (typeof token !== "string" || token.length === 0) {
      return {
        ok: false,
        errorKind: "target_rejected",
        retryHint: "not_retryable",
        errorMessage: "Feishu tenant access token response was missing the token",
        statusCode: response.status,
        responseBody,
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
      errorKind: "network_error",
      retryHint: "retryable",
      errorMessage:
        error instanceof Error && error.message.trim()
          ? `Feishu tenant access token request failed: ${error.message}`
          : "Feishu tenant access token request failed",
      statusCode: null,
      responseBody: null,
    };
  }
}
