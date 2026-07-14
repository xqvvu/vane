import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

describe("root route i18n wiring", () => {
  it("resolves the request locale before rendering and applies it to html/provider", () => {
    const source = readFileSync(fileURLToPath(new URL("./__root.tsx", import.meta.url)), "utf8");

    expect(source).toContain("context.queryClient.ensureQueryData(requestLocaleQueryOptions())");
    expect(source).toContain("<html lang={data.locale}>");
    expect(source).toContain("<VaneIntlProvider locale={data.locale} timeZone={data.timeZone}>");
  });
});
