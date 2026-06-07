import { describe, expect, it } from "vitest";

import { REDACTED_VALUE, redactHeaders, redactJsonValue } from "#/redaction.ts";

describe("redaction", () => {
  it("redacts common sensitive headers", () => {
    expect(
      redactHeaders({
        Authorization: "Bearer secret",
        "X-Request-Id": "req-1",
        Cookie: "session=secret",
      }),
    ).toEqual({
      Authorization: REDACTED_VALUE,
      "X-Request-Id": "req-1",
      Cookie: REDACTED_VALUE,
    });
  });

  it("redacts nested sensitive JSON fields", () => {
    expect(
      redactJsonValue({
        title: "alert",
        destination: {
          webhook_url: "https://example.test/secret",
          token: "secret",
        },
      }),
    ).toEqual({
      title: "alert",
      destination: {
        webhook_url: REDACTED_VALUE,
        token: REDACTED_VALUE,
      },
    });
  });
});
