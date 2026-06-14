import { describe, expect, it } from "vitest";

import { getMessages } from "#/i18n/messages.ts";
import enUsMessages from "#/i18n/messages/en-US.json";
import zhHansMessages from "#/i18n/messages/zh-Hans.json";

describe("i18n messages", () => {
  it("keeps zh-Hans keys in parity with en-US", () => {
    expect(Object.keys(zhHansMessages).sort()).toEqual(Object.keys(enUsMessages).sort());
  });

  it("keeps locale source files flat", () => {
    expectFlatMessages(enUsMessages);
    expectFlatMessages(zhHansMessages);
  });

  it("expands flat source files for use-intl runtime lookup", () => {
    expect(getMessages("en-US")).toMatchObject({
      common: {
        actions: {
          refresh: "Refresh",
        },
      },
    });
  });
});

function expectFlatMessages(messages: Record<string, unknown>): void {
  for (const [key, value] of Object.entries(messages)) {
    expect(key).toContain(".");
    expect(value).toEqual(expect.any(String));
  }
}
