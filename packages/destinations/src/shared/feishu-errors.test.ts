import { describe, expect, it } from "vite-plus/test";

import { feishuErrorDecision, feishuTokenIsInvalid, withOperatorHint } from "./feishu-errors";
import { feishuBusinessCode, feishuInvalidUserIds } from "./feishu-result";

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

  it("appends guidance without losing the platform message", () => {
    expect(withOperatorHint("Feishu returned code 230002", "do the thing")).toBe(
      "Feishu returned code 230002. Fix: do the thing",
    );
    expect(withOperatorHint("Feishu returned code 230002", null)).toBe(
      "Feishu returned code 230002",
    );
  });
});
