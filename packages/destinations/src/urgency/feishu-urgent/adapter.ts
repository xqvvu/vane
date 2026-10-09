import { z } from "zod";

import { fetchFeishuTenantAccessToken } from "#destinations/shared/feishu-app-client";
import type { DestinationTransportContext } from "#destinations/types";
import { callFeishuUrgentPhone } from "#destinations/urgency/feishu-urgent/client";
import {
  UrgencyPingInputSchema,
  type UrgencyChannelAdapter,
  type UrgencyPingResult,
} from "#destinations/urgency/types";
import { Adapter } from "#destinations/utils";

/** Refresh a cached tenant token this long before it expires. */
const TOKEN_REFRESH_SKEW_MS = 60_000;

interface CachedTenantToken {
  token: string;
  expiresAtMs: number;
}

type FailedPing = Extract<UrgencyPingResult, { ok: false }>;

/**
 * Feishu urgent phone channel.
 *
 * Paging is two platform steps: exchange the app credential for a tenant
 * access token, then ask Feishu to urgent-call the receivers about an existing
 * app-sent message. The token is cached per credential pair on the adapter
 * instance — the registry owns one instance for the process — so a call storm
 * does not hammer the token endpoint.
 */
export function createFeishuUrgentPhoneAdapter(): UrgencyChannelAdapter<"feishu_urgent_phone"> {
  const tenantTokens = new Map<string, CachedTenantToken>();

  return {
    kind: "feishu_urgent_phone",

    async ping(input, context) {
      const parsed = UrgencyPingInputSchema.safeParse(input);

      if (!parsed.success) {
        return invalidPingResult(parsed.error);
      }

      const { app, messageId, receivers, userIdType } = parsed.data;
      const token = await resolveTenantToken(app, tenantTokens, context);

      if (!token.ok) {
        return token;
      }

      return callFeishuUrgentPhone(
        {
          tenantAccessToken: token.tenantAccessToken,
          messageId,
          receivers,
          userIdType,
        },
        context,
      );
    },
  };
}

async function resolveTenantToken(
  app: { appId: string; appSecret: string },
  cache: Map<string, CachedTenantToken>,
  context: DestinationTransportContext | undefined,
): Promise<{ ok: true; tenantAccessToken: string } | FailedPing> {
  const { now } = Adapter.getTransportContext(context);
  const cacheKey = `${app.appId}\u0000${app.appSecret}`;
  const cached = cache.get(cacheKey);
  const nowMs = now().valueOf();

  if (cached && cached.expiresAtMs - TOKEN_REFRESH_SKEW_MS > nowMs) {
    return { ok: true, tenantAccessToken: cached.token };
  }

  const result = await fetchFeishuTenantAccessToken(
    { appId: app.appId, appSecret: app.appSecret },
    context,
  );

  if (!result.ok) {
    return result;
  }

  cache.set(cacheKey, {
    token: result.tenantAccessToken,
    expiresAtMs: nowMs + result.expiresInSeconds * 1000,
  });

  return { ok: true, tenantAccessToken: result.tenantAccessToken };
}

function invalidPingResult(error: z.ZodError): FailedPing {
  const [issue] = error.issues;
  const detail = issue ? `${issue.path.join(".") || "input"}: ${issue.message}` : "invalid input";

  return {
    ok: false,
    errorKind: "configuration_error",
    retryHint: "not_retryable",
    errorMessage: `Urgent phone request is invalid (${detail})`,
    statusCode: null,
    responseBody: null,
  };
}
