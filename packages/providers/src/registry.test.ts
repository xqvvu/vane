import { describe, expect, it } from "vitest";

import { createDefaultProviderRegistry } from "#/registry.ts";

describe("provider registry", () => {
  it("audits the default adapter registry without warnings", () => {
    const registry = createDefaultProviderRegistry();

    expect(registry.audit()).toEqual({ warnings: [] });
  });

  it("projects provider adapters to a client-safe catalog", () => {
    const catalog = createDefaultProviderRegistry().toCatalog();

    expect(catalog.map((item) => item.provider).sort()).toEqual([
      "alertmanager",
      "generic",
      "grafana",
      "signoz",
      "uptime_kuma",
    ]);
    expect(catalog.find((item) => item.provider === "grafana")).toMatchObject({
      provider: "grafana",
      configVersion: 1,
      lifecycle: {
        status: "stable",
      },
      displayNameKey: "sources.providers.grafana",
      capabilities: {
        parse: true,
        testPayload: true,
        sourceToken: true,
        providerSecret: true,
      },
    });
    for (const item of catalog) {
      expect(item).not.toHaveProperty("secretFields");
      expect(item).not.toHaveProperty("configSchema");
      expect(item).not.toHaveProperty("parse");
    }
  });

  it("returns structured parse failures for expected adapter rejections", () => {
    const result = createDefaultProviderRegistry().parse("grafana", {
      source: {
        id: "source-grafana",
        name: "Grafana prod",
        provider: "grafana",
        enabled: true,
      },
      sourceId: "source-grafana",
      sourceName: "Grafana prod",
      receivedAt: "2026-06-09T08:00:00.000Z",
      headers: {},
      payload: "not an object",
      config: {},
    });

    expect(result).toMatchObject({
      ok: false,
      reason: "invalid_payload",
      message: "Expected grafana webhook payload object",
    });
  });
});
