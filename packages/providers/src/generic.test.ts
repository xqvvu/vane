import { describe, expect, it } from "vitest";

import { parseGenericProvider } from "#/generic.ts";

describe("generic provider parser", () => {
  it("normalizes representative alert-like payloads", () => {
    const result = parseGenericProvider({
      sourceId: "source-generic",
      sourceName: "custom-emitter",
      receivedAt: "2026-06-07T08:00:00.000Z",
      headers: {
        "content-type": "application/json",
      },
      payload: {
        id: "evt-123",
        title: "Checkout unavailable",
        message: "checkout returned 503",
        severity: "high",
        status: "triggered",
        labels: {
          service: "checkout",
          env: "prod",
        },
        occurredAt: "2026-06-07T07:59:00.000Z",
      },
    });

    expect(result.normalized).toEqual({
      title: "Checkout unavailable",
      message: "checkout returned 503",
      severity: "critical",
      status: "firing",
      fingerprint: expect.stringMatching(/^generic:/),
      labels: {
        service: "checkout",
        env: "prod",
        severity: "high",
        status: "triggered",
      },
      occurredAt: "2026-06-07T07:59:00.000Z",
    });
    expect(result.idempotencyKey).toBe("evt-123");
    expect(result.providerMetadata.payloadHash).toEqual(expect.any(String));
  });

  it("derives stable idempotency from identical payloads", () => {
    const first = parseGenericProvider({
      sourceId: "source-generic",
      sourceName: "custom-emitter",
      receivedAt: "2026-06-07T08:00:00.000Z",
      headers: {},
      payload: {
        message: "same alert",
        title: "same",
      },
    });
    const second = parseGenericProvider({
      sourceId: "source-generic",
      sourceName: "custom-emitter",
      receivedAt: "2026-06-07T08:01:00.000Z",
      headers: {},
      payload: {
        title: "same",
        message: "same alert",
      },
    });

    expect(first.idempotencyKey).toBe(second.idempotencyKey);
    expect(first.normalized.fingerprint).toBe(second.normalized.fingerprint);
  });
});
