import { FEISHU_MESSAGES_URL } from "#destinations/shared/feishu-endpoints";
import { feishuFailureMessage, parseFeishuResult } from "#destinations/shared/feishu-result";
import type {
  DestinationErrorKind,
  DestinationRetryHint,
  DestinationTransportContext,
} from "#destinations/types";
import { Adapter, Send } from "#destinations/utils";

export interface FeishuUrgentPhoneCall {
  tenantAccessToken: string;
  messageId: string;
  receivers: string[];
  userIdType: "open_id" | "user_id" | "union_id";
}

export type FeishuUrgentPhoneCallResult =
  | { ok: true; statusCode: number; responseBody: string }
  | {
      ok: false;
      errorKind: DestinationErrorKind;
      retryHint: DestinationRetryHint;
      errorMessage: string;
      statusCode: number | null;
      responseBody: string | null;
    };

/**
 * Asks Feishu to urgent-call the receivers about an existing message
 * (`PATCH /open-apis/im/v1/messages/:message_id/urgent_phone`).
 *
 * The message must be one the app itself sent; the platform rejects the call
 * otherwise. Business rejections (quota, permission, invalid receivers) are
 * non-retryable — retrying the same call cannot succeed — while transport and
 * HTTP-level failures keep the standard retry hint.
 */
export async function callFeishuUrgentPhone(
  input: FeishuUrgentPhoneCall,
  context?: DestinationTransportContext,
): Promise<FeishuUrgentPhoneCallResult> {
  const { fetch } = Adapter.getTransportContext(context);
  const url = `${FEISHU_MESSAGES_URL}/${encodeURIComponent(input.messageId)}/urgent_phone?user_id_type=${input.userIdType}`;

  try {
    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${input.tenantAccessToken}`,
      },
      body: JSON.stringify({ urgent_receivers: { user_id_list: input.receivers } }),
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
          "Feishu returned an unreadable urgent phone response",
        ),
        statusCode: response.status,
        responseBody,
      };
    }

    return { ok: true, statusCode: response.status, responseBody };
  } catch (error) {
    return {
      ok: false,
      errorKind: "network_error",
      retryHint: "retryable",
      errorMessage:
        error instanceof Error && error.message.trim()
          ? `Feishu urgent phone request failed: ${error.message}`
          : "Feishu urgent phone request failed",
      statusCode: null,
      responseBody: null,
    };
  }
}
