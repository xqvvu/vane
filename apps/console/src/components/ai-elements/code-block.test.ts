import { describe, expect, it } from "vitest";

import { highlightCode } from "#/components/ai-elements/code-block.tsx";

describe("highlightCode", () => {
  it("tokenizes JSON with the configured fine-grained Shiki bundle", async () => {
    const code = '{"status":"ok","attempt":1}';
    const tokenized = await new Promise<NonNullable<ReturnType<typeof highlightCode>>>(
      (resolve) => {
        const cached = highlightCode(code, "json", resolve);

        if (cached) {
          resolve(cached);
        }
      },
    );

    expect(
      tokenized.tokens
        .flat()
        .map((token) => token.content)
        .join(""),
    ).toBe(code);
    expect(tokenized.tokens.flat().some((token) => token.color !== "inherit")).toBe(true);
  });
});
