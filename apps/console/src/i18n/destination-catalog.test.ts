import { describe, expect, it } from "vitest";

import { createDefaultDestinationRegistry } from "@vane/destinations";

import enUsMessages from "#/i18n/messages/en-US.json";

describe("destination catalog i18n", () => {
  it("keeps default destination manifest message keys backed by console messages", () => {
    const registry = createDefaultDestinationRegistry();
    const messageKeys = new Set(Object.keys(enUsMessages));

    expect(registry.audit({ messageKeys })).toEqual({ warnings: [] });
  });
});
