import { describe, expect, it } from "vitest";

import { createDefaultProviderRegistry } from "#/registry.ts";
import { parseUptimeKumaProvider } from "#/uptime-kuma/index.ts";

const receivedAt = "2026-06-09T08:00:00.000Z";

describe("uptime kuma provider parser", () => {
  it("normalizes down notifications as firing alerts", () => {
    const result = parseUptimeKumaProvider({
      sourceId: "source-uptime-kuma",
      sourceName: "Uptime Kuma prod",
      receivedAt,
      headers: {
        "content-type": "application/json",
      },
      payload: {
        msg: "[Vane API] is down",
        monitor: {
          id: 42,
          name: "Vane API",
          type: "http",
          url: "https://vane.example.test/health",
        },
        heartbeat: {
          status: 0,
          msg: "timeout",
          time: "2026-06-09T07:57:00Z",
        },
      },
    });

    expect(result.normalized).toEqual({
      title: "Vane API is firing",
      message: "[Vane API] is down",
      severity: "critical",
      status: "firing",
      fingerprint: "uptime_kuma:42",
      labels: {
        provider: "uptime_kuma",
        monitor: "Vane API",
        type: "http",
        url: "https://vane.example.test/health",
      },
      occurredAt: "2026-06-09T07:57:00.000Z",
    });
    expect(result.providerMetadata).toMatchObject({
      provider: "uptime_kuma",
      parserVersion: 1,
    });
    expect(result.idempotencyKey).toMatch(/^uptime_kuma:/);
  });

  it("normalizes up notifications as resolved alerts", () => {
    const result = parseUptimeKumaProvider({
      sourceId: "source-uptime-kuma",
      sourceName: "Uptime Kuma prod",
      receivedAt,
      headers: {},
      payload: {
        msg: "[Vane API] is up",
        monitor: {
          id: 42,
          name: "Vane API",
        },
        heartbeat: {
          status: 1,
          time: "2026-06-09T08:02:00Z",
        },
      },
    });

    expect(result.normalized.status).toBe("resolved");
    expect(result.normalized.severity).toBe("info");
    expect(result.normalized.fingerprint).toBe("uptime_kuma:42");
    expect(result.normalized.occurredAt).toBe("2026-06-09T08:02:00.000Z");
  });

  it("registers Uptime Kuma in the default provider registry", () => {
    const adapter = createDefaultProviderRegistry().get("uptime_kuma");

    expect(adapter.manifest.provider).toBe("uptime_kuma");
  });

  it("rejects non-object Uptime Kuma webhook payloads", () => {
    expect(() =>
      parseUptimeKumaProvider({
        sourceId: "source-uptime-kuma",
        sourceName: "Uptime Kuma prod",
        receivedAt,
        headers: {},
        payload: "not an object",
      }),
    ).toThrow("Expected uptime_kuma webhook payload object");
  });
});
