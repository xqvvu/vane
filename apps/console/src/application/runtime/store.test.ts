import { afterEach, describe, expect, it, vi } from "vitest";

const store = { id: "store" };
const destinations = { id: "destinations" };
const runner = {
  runNow: vi.fn<() => void>(),
  stop: vi.fn<() => void>(),
};
const container = {
  getSqliteStore: vi.fn<() => typeof store>(() => store),
  getDestinationRegistry: vi.fn<() => typeof destinations>(() => destinations),
  ensureDeliveryWorkerRunner: vi.fn<() => typeof runner>(() => runner),
};

vi.mock("#/application/runtime/container.server.ts", () => ({
  getApplicationContainer: () => container,
}));

describe("application store facade", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("delegates legacy store helpers to the application container", async () => {
    const { createDefaultDeliveryWorkerDependencies, ensureDeliveryWorkerRunner, getSqliteStore } =
      await import("#/application/runtime/store.ts");

    expect(getSqliteStore()).toBe(store);
    expect(createDefaultDeliveryWorkerDependencies()).toEqual({
      store,
      destinations,
    });
    expect(ensureDeliveryWorkerRunner()).toBe(runner);
    expect(container.getSqliteStore).toHaveBeenCalledTimes(2);
    expect(container.getDestinationRegistry).toHaveBeenCalledTimes(1);
    expect(container.ensureDeliveryWorkerRunner).toHaveBeenCalledTimes(1);
  });
});
