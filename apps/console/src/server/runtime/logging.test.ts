import { getConfig, reset } from "@logtape/logtape";
import { afterEach, describe, expect, it, vi } from "vitest";

import { logger } from "#/server/runtime/logging";

describe("logging runtime", () => {
  afterEach(async () => {
    await reset();
    vi.restoreAllMocks();
  });

  it("configures LogTape once across concurrent and repeated initialization", async () => {
    vi.spyOn(console, "info").mockImplementation(() => {});

    await Promise.all([logger(), logger()]);
    const configured = getConfig();

    expect(configured).not.toBeNull();
    await expect(logger()).resolves.toBeUndefined();
    expect(getConfig()).toBe(configured);
  });
});
