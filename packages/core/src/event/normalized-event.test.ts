import { describe, expect, it } from "vitest";

import { NormalizedEventSchema } from "#/event/normalized-event.ts";

describe("normalized events", () => {
  it("normalizes label keys and values for inspectable routing", () => {
    const event = NormalizedEventSchema.parse({
      title: "CPU high",
      message: "CPU is above threshold",
      severity: "critical",
      status: "firing",
      fingerprint: "cpu:api",
      labels: {
        " service ": " checkout ",
        empty: "   ",
      },
      occurredAt: "2026-06-09T08:00:00.000Z",
    });

    expect(event.labels).toEqual({
      service: "checkout",
    });
  });
});
