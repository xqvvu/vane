import { describe, expect, it } from "vitest";

import { stableStringify } from "#core/hash";

describe("hash helpers", () => {
  it("stable stringifies object keys recursively", () => {
    expect(stableStringify({ z: 1, a: { y: 2, b: 3 } })).toBe('{"a":{"b":3,"y":2},"z":1}');
  });
});
