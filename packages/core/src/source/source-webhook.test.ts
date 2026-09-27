import { describe, expect, it } from "vite-plus/test";

import { sourceWebhookPath } from "#core/source/source-webhook";

describe("source webhook helpers", () => {
  it("builds encoded webhook paths for source ids", () => {
    expect(sourceWebhookPath("source/grafana prod")).toBe(
      "/api/sources/source%2Fgrafana%20prod/webhook",
    );
  });
});
