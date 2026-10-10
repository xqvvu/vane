import { describe, expect, it } from "vite-plus/test";

import {
  feishuErrorDecision,
  feishuErrorKind,
  feishuTokenIsInvalid,
  withOperatorHint,
} from "./feishu-errors";
import { feishuBusinessCode, feishuFailureSummary, feishuInvalidUserIds } from "./feishu-result";

describe("feishu error classification", () => {
  it("treats the documented transient codes as retryable", () => {
    // 99991400 rate limit, 11232/11233 send rate limits, 230023 unread urgent cap.
    for (const code of [99991400, 11232, 11233, 230023]) {
      expect(feishuErrorDecision(code, 400)).toMatchObject({ retryHint: "retryable" });
    }
  });

  it("treats a 429 response as retryable even without a body code", () => {
    expect(feishuErrorDecision(99991400, 429).retryHint).toBe("retryable");
    expect(feishuErrorDecision(null, 429).retryHint).toBe("retryable");
  });

  it("treats platform credential problems as retryable with a fresh token", () => {
    for (const code of [99991661, 99991663, 99991665]) {
      expect(feishuTokenIsInvalid(code)).toBe(true);
      expect(feishuErrorDecision(code, 400)).toMatchObject({
        retryHint: "retryable",
        operatorHint: expect.stringContaining("tenant access token"),
      });
    }

    expect(feishuTokenIsInvalid(230002)).toBe(false);
    expect(feishuTokenIsInvalid(null)).toBe(false);
  });

  it("keeps configuration and quota rejections non-retryable and explains them", () => {
    const cases: Array<[number, string]> = [
      [230001, "every receiver id was invalid"],
      [230002, "bot to the target group"],
      [230006, "bot ability"],
      [230012, "sent the message"],
      [230013, "availability scope"],
      [230024, "quota"],
      [230027, "external group"],
      [230052, "owner/admins"],
      [230098, "Folded"],
      [230110, "deleted"],
      [232009, "dissolved"],
      [99991672, "im:message.urgent:phone"],
      [99991403, "monthly API call quota"],
    ];

    for (const [code, hint] of cases) {
      const decision = feishuErrorDecision(code, 400);

      expect(decision, `code ${code}`).toMatchObject({ retryHint: "not_retryable" });
      expect(decision.operatorHint, `code ${code}`).toContain(hint);
    }
  });

  it("defaults an unknown code to a non-retryable rejection without inventing guidance", () => {
    expect(feishuErrorDecision(19024, 400)).toEqual({
      retryHint: "not_retryable",
      operatorHint: null,
    });
    expect(feishuErrorDecision(null, null)).toEqual({
      retryHint: "not_retryable",
      operatorHint: null,
    });
  });

  it("reads the numeric business code from either shape", () => {
    expect(feishuBusinessCode({ code: 230001 })).toBe(230001);
    expect(feishuBusinessCode({ StatusCode: "0" })).toBe(0);
    expect(feishuBusinessCode({ msg: "success" })).toBeNull();
    expect(feishuBusinessCode(null)).toBeNull();
  });

  it("reads the silently skipped receivers from a partial-success urgent response", () => {
    expect(
      feishuInvalidUserIds({
        code: 0,
        data: { invalid_user_id_list: ["ou_1", 7, ""] },
      }),
    ).toEqual(["ou_1"]);
    expect(feishuInvalidUserIds({ code: 0, data: {} })).toEqual([]);
    expect(feishuInvalidUserIds({ code: 0 })).toEqual([]);
    expect(feishuInvalidUserIds(null)).toEqual([]);
  });

  it("keeps the platform message in one failure summary", () => {
    expect(
      feishuFailureSummary({ code: 230002, msg: "The bot can not be outside the group." }, 400),
    ).toBe("Feishu returned code 230002: The bot can not be outside the group. (HTTP 400)");
    // A webhook rejection answered with HTTP 200 should not quote the status.
    expect(feishuFailureSummary({ code: 11232, msg: "rate limited" }, 200)).toBe(
      "Feishu returned code 11232: rate limited",
    );
    // No usable body code: the status is all the platform said.
    expect(feishuFailureSummary(null, 502)).toBe("Feishu returned HTTP 502");
    expect(feishuFailureSummary({ code: 0 }, 429)).toBe("Feishu returned HTTP 429");
  });

  it("labels a documented HTTP 400 business rejection as a platform rejection", () => {
    // The endpoint error tables answer bot-not-in-group, missing scope, quota, etc.
    // with HTTP 400 plus a code. Only a body without a business code (or one that
    // claims success) means the transport/status itself failed.
    expect(feishuErrorKind(230002)).toBe("target_rejected");
    expect(feishuErrorKind(99991400)).toBe("target_rejected");
    expect(feishuErrorKind(0)).toBe("http_error");
    expect(feishuErrorKind(null)).toBe("http_error");
  });

  it("appends guidance without losing the platform message", () => {
    expect(withOperatorHint("Feishu returned code 230002", "do the thing")).toBe(
      "Feishu returned code 230002. Fix: do the thing",
    );
    expect(withOperatorHint("Feishu returned code 230002", null)).toBe(
      "Feishu returned code 230002",
    );
  });
});
