import { describe, expect, it } from "vitest";

import { createDefaultDestinationRegistry } from "#/registry.ts";

describe("destination registry", () => {
  it("audits the default adapter registry without warnings", () => {
    const registry = createDefaultDestinationRegistry();

    expect(registry.audit()).toEqual({ warnings: [] });
  });

  it("projects adapters to a client-safe catalog", () => {
    const catalog = createDefaultDestinationRegistry().toCatalog();

    expect(catalog.map((item) => item.kind).sort()).toEqual([
      "email",
      "feishu",
      "generic_webhook",
      "slack",
    ]);
    expect(catalog.find((item) => item.kind === "generic_webhook")).toMatchObject({
      kind: "generic_webhook",
      configVersion: 1,
      lifecycle: {
        status: "stable",
      },
      displayNameKey: "destinations.kinds.generic_webhook",
      capabilities: {
        preview: true,
        test: true,
        delivery: true,
      },
    });
    expect(JSON.stringify(catalog)).not.toContain("secretFields");
    expect(JSON.stringify(catalog)).not.toContain("configSchema");
    expect(JSON.stringify(catalog)).not.toContain("send");
  });
});
