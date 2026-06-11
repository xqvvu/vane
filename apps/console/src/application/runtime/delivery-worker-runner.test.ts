import { describe, expect, it, vi } from "vitest";

import {
  createDeliveryWorkerRunner,
  type DeliveryWorkerClearInterval,
  type DeliveryWorkerSetInterval,
} from "#/application/runtime/delivery-worker-runner.ts";

interface TestRunResult {
  claimed: number;
  succeeded: number;
  failed: number;
  retrying: number;
}

describe("delivery worker runner", () => {
  it("runs the worker on an interval and can be stopped", async () => {
    const callbacks: Array<() => void> = [];
    const clearIntervalFn = vi.fn<DeliveryWorkerClearInterval>();
    const worker = {
      runOnce: vi.fn<() => Promise<TestRunResult>>(async () => ({
        claimed: 0,
        succeeded: 0,
        failed: 0,
        retrying: 0,
      })),
    };

    const runner = createDeliveryWorkerRunner({
      worker,
      intervalMs: 250,
      setIntervalFn: ((callback, intervalMs) => {
        callbacks.push(callback);
        expect(intervalMs).toBe(250);
        return { unref: vi.fn<() => void>() };
      }) satisfies DeliveryWorkerSetInterval,
      clearIntervalFn,
    });

    callbacks[0]?.();
    await Promise.resolve();

    expect(worker.runOnce).toHaveBeenCalledTimes(1);

    runner.stop();

    expect(clearIntervalFn).toHaveBeenCalledTimes(1);
  });

  it("skips overlapping runs and logs worker failures", async () => {
    let resolveRun: ((value: TestRunResult) => void) | undefined;
    const onError = vi.fn<(error: unknown) => void>();
    const worker = {
      runOnce: vi.fn<() => Promise<TestRunResult>>(
        () =>
          new Promise<TestRunResult>((resolve) => {
            resolveRun = resolve;
          }),
      ),
    };
    const runner = createDeliveryWorkerRunner({
      worker,
      setIntervalFn: (() => ({
        unref: vi.fn<() => void>(),
      })) satisfies DeliveryWorkerSetInterval,
      clearIntervalFn: vi.fn<DeliveryWorkerClearInterval>(),
      onError,
    });

    const first = runner.runNow();
    const second = await runner.runNow();

    expect(second).toBeNull();
    expect(worker.runOnce).toHaveBeenCalledTimes(1);

    resolveRun?.({
      claimed: 1,
      succeeded: 1,
      failed: 0,
      retrying: 0,
    });

    await expect(first).resolves.toEqual({
      claimed: 1,
      succeeded: 1,
      failed: 0,
      retrying: 0,
    });

    worker.runOnce.mockRejectedValueOnce(new Error("boom"));

    await expect(runner.runNow()).resolves.toBeNull();
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });
});
