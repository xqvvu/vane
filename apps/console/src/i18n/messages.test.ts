import { describe, expect, it } from "vitest";

import enUsMessages from "#/i18n/messages/en-US.json";
import zhHansMessages from "#/i18n/messages/zh-Hans.json";

describe("i18n messages", () => {
  it("keeps zh-Hans keys in parity with en-US", () => {
    expect(flattenMessageKeys(zhHansMessages)).toEqual(flattenMessageKeys(enUsMessages));
  });
});

function flattenMessageKeys(value: unknown, prefix = ""): string[] {
  if (!isMessageRecord(value)) {
    return [prefix];
  }

  return Object.keys(value)
    .sort()
    .flatMap((key) => flattenMessageKeys(value[key], prefix ? `${prefix}.${key}` : key));
}

function isMessageRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
