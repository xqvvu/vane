import { afterEach, describe, expect, it, vi } from "vitest";

const store = { id: "store" };
const destinations = { id: "destinations" };
const runner = {
  runNow: vi.fn<() => void>(),
  getHealth: vi.fn<() => unknown>(() => ({
    state: "idle",
    lastStartedAt: null,
    lastFinishedAt: null,
    lastError: null,
    lastRun: null,
  })),
  stop: vi.fn<() => void>(),
};
const container = {
  getSqliteStore: vi.fn<() => Promise<typeof store>>(async () => store),
  getDestinationRegistry: vi.fn<() => typeof destinations>(() => destinations),
  ensureDeliveryWorkerRunner: vi.fn<() => Promise<typeof runner>>(async () => runner),
};

vi.mock("#/server/runtime/container", () => ({
  getApplicationContainer: () => container,
}));

describe("application store facade", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("delegates legacy store helpers to the application container", async () => {
    const { createDefaultDeliveryWorkerDependencies, ensureDeliveryWorkerRunner, getSqliteStore } =
      await import("#/server/runtime/store");

    await expect(getSqliteStore()).resolves.toBe(store);
    await expect(createDefaultDeliveryWorkerDependencies()).resolves.toEqual({
      store,
      destinations,
    });
    await expect(ensureDeliveryWorkerRunner()).resolves.toBe(runner);
    expect(container.getSqliteStore).toHaveBeenCalledTimes(2);
    expect(container.getDestinationRegistry).toHaveBeenCalledTimes(1);
    expect(container.ensureDeliveryWorkerRunner).toHaveBeenCalledTimes(1);
  });
});
