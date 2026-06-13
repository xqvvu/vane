import { describe, expect, it } from "vitest";

import { toJsonValue } from "#/json.ts";

describe("JSON helpers", () => {
  it("converts unknown object values into serializable JSON values", () => {
    const symbol = Symbol("secret");

    expect(
      toJsonValue({
        ok: true,
        count: 2,
        nested: { value: Number.POSITIVE_INFINITY },
        omitted: undefined,
        callback: () => "ignored",
        symbol,
      }),
    ).toEqual({
      ok: true,
      count: 2,
      nested: { value: null },
    });
  });
});
