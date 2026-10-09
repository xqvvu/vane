import { describe, expect, it } from "vite-plus/test";

import type { FetchLike, FetchLikeResponse } from "#destinations/types";
import { createFeishuUrgentPhoneAdapter } from "#destinations/urgency/feishu-urgent/index";

const TOKEN_URL = "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal";
const URGENT_URL =
  "https://open.feishu.cn/open-apis/im/v1/messages/om_123/urgent_phone?user_id_type=open_id";

const tokenResponse = { code: 0, msg: "ok", tenant_access_token: "t-1", expire: 7200 };
const pingInput = {
  app: { appId: "cli_sre", appSecret: "secret-1" },
  messageId: "om_123",
  receivers: ["ou_1", "ou_2"],
  userIdType: "open_id" as const,
};

describe("feishu urgent phone channel", () => {
  it("exchanges the app credential and urgent-calls the existing message", async () => {
    const urgentResponse = { code: 0, msg: "success" };
    const { calls, fetch } = createRecordingFetch([
      jsonResponse(tokenResponse),
      jsonResponse(urgentResponse),
    ]);
    const adapter = createFeishuUrgentPhoneAdapter();

    const result = await adapter.ping(pingInput, {
      fetch,
      now: () => new Date("2026-10-09T00:00:00.000Z"),
    });

    expect(result).toEqual({
      ok: true,
      statusCode: 200,
      responseBody: JSON.stringify(urgentResponse),
    });
    expect(calls.map((call) => call.url)).toEqual([TOKEN_URL, URGENT_URL]);
    expect(calls[0]?.init).toMatchObject({
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ app_id: "cli_sre", app_secret: "secret-1" }),
    });
    expect(calls[1]?.init).toMatchObject({
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer t-1",
      },
      body: JSON.stringify({ urgent_receivers: { user_id_list: ["ou_1", "ou_2"] } }),
    });
  });

  it("reuses the tenant token until it is close to expiry", async () => {
    const { calls, fetch } = createRecordingFetch([
      jsonResponse(tokenResponse),
      jsonResponse({ code: 0 }),
      jsonResponse({ code: 0 }),
      jsonResponse(tokenResponse),
      jsonResponse({ code: 0 }),
    ]);
    const adapter = createFeishuUrgentPhoneAdapter();
    let clock = new Date("2026-10-09T00:00:00.000Z");
    const context = { fetch, now: () => clock };

    await adapter.ping(pingInput, context);
    clock = new Date("2026-10-09T01:00:00.000Z");
    await adapter.ping(pingInput, context);
    clock = new Date("2026-10-09T02:00:00.000Z");
    await adapter.ping(pingInput, context);

    expect(calls.map((call) => call.url)).toEqual([
      TOKEN_URL,
      URGENT_URL,
      URGENT_URL,
      TOKEN_URL,
      URGENT_URL,
    ]);
  });

  it("maps Feishu business rejections to non-retryable failures", async () => {
    const { fetch } = createRecordingFetch([
      jsonResponse(tokenResponse),
      jsonResponse({ code: 99991672, msg: "permission denied" }),
    ]);
    const adapter = createFeishuUrgentPhoneAdapter();

    const result = await adapter.ping(pingInput, { fetch });

    expect(result).toMatchObject({
      ok: false,
      errorKind: "target_rejected",
      retryHint: "not_retryable",
      statusCode: 200,
    });
    expect(result.ok ? "" : result.errorMessage).toContain("99991672");
    expect(result.ok ? "" : result.errorMessage).toContain("permission denied");
    expect(JSON.stringify(result)).not.toContain("secret-1");
  });

  it("keeps HTTP and transport failures retryable", async () => {
    const throttled = createRecordingFetch([
      jsonResponse(tokenResponse),
      jsonResponse({ code: 0 }, 429),
    ]);

    const throttledResult = await createFeishuUrgentPhoneAdapter().ping(pingInput, {
      fetch: throttled.fetch,
    });

    expect(throttledResult).toMatchObject({
      ok: false,
      errorKind: "http_error",
      retryHint: "retryable",
      statusCode: 429,
    });

    const broken = createRecordingFetch([jsonResponse(tokenResponse), new Error("socket hang up")]);

    const brokenResult = await createFeishuUrgentPhoneAdapter().ping(pingInput, {
      fetch: broken.fetch,
    });

    expect(brokenResult).toMatchObject({
      ok: false,
      errorKind: "network_error",
      retryHint: "retryable",
      statusCode: null,
    });
    expect(brokenResult.ok ? "" : brokenResult.errorMessage).toContain("socket hang up");
  });

  it("fails with the token error when the credential is rejected", async () => {
    const { calls, fetch } = createRecordingFetch([
      jsonResponse({ code: 10003, msg: "invalid param" }),
    ]);
    const adapter = createFeishuUrgentPhoneAdapter();

    const result = await adapter.ping(pingInput, { fetch });

    expect(result).toMatchObject({
      ok: false,
      errorKind: "target_rejected",
      retryHint: "not_retryable",
    });
    expect(result.ok ? "" : result.errorMessage).toContain("10003");
    expect(calls).toHaveLength(1);
  });

  it("rejects invalid requests before any network call", async () => {
    const { calls, fetch } = createRecordingFetch([]);
    const adapter = createFeishuUrgentPhoneAdapter();

    const result = await adapter.ping({ ...pingInput, receivers: [] }, { fetch });

    expect(result).toMatchObject({
      ok: false,
      errorKind: "configuration_error",
      retryHint: "not_retryable",
      statusCode: null,
    });
    expect(result.ok ? "" : result.errorMessage).toContain("receivers");
    expect(calls).toHaveLength(0);
  });
});

type FetchStep = FetchLikeResponse | Error;

function createRecordingFetch(script: FetchStep[]) {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const fetch: FetchLike = async (url, init) => {
    calls.push({ url, init });

    const next = script.shift();

    if (!next) {
      throw new Error(`Unexpected fetch call: ${url}`);
    }

    if (next instanceof Error) {
      throw next;
    }

    return next;
  };

  return { calls, fetch };
}

function jsonResponse(body: unknown, status = 200): FetchLikeResponse {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body),
  };
}
