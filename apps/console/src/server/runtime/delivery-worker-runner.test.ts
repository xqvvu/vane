import { describe, expect, it, vi } from "vitest";

import {
  createDeliveryWorkerRunner,
  type DeliveryWorkerClearInterval,
  type DeliveryWorkerSetInterval,
} from "#/server/runtime/delivery-worker-runner";

interface TestRunResult {
  claimed: number;
  reclaimed: number;
  succeeded: number;
  failed: number;
  retrying: number;
  startedAt: string;
  finishedAt: string;
}

const idleRunResult: TestRunResult = {
  claimed: 0,
  reclaimed: 0,
  succeeded: 0,
  failed: 0,
  retrying: 0,
  startedAt: "2026-06-09T08:00:00.000Z",
  finishedAt: "2026-06-09T08:00:00.000Z",
};

const successRunResult: TestRunResult = {
  claimed: 1,
  reclaimed: 0,
  succeeded: 1,
  failed: 0,
  retrying: 0,
  startedAt: "2026-06-09T08:01:00.000Z",
  finishedAt: "2026-06-09T08:01:00.000Z",
};

describe("delivery worker runner", () => {
  it("runs the worker on an interval and can be stopped", async () => {
    const callbacks: Array<() => void> = [];
    const clearIntervalFn = vi.fn<DeliveryWorkerClearInterval>();
    const worker = {
      runOnce: vi.fn<() => Promise<TestRunResult>>(async () => idleRunResult),
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

    resolveRun?.(successRunResult);

    await expect(first).resolves.toEqual(successRunResult);
    expect(runner.getHealth()).toEqual({
      state: "idle",
      lastStartedAt: successRunResult.startedAt,
      lastFinishedAt: successRunResult.finishedAt,
      lastError: null,
      lastRun: successRunResult,
    });

    worker.runOnce.mockRejectedValueOnce(new Error("boom token=runner-token"));

    await expect(runner.runNow()).resolves.toBeNull();
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
    expect(runner.getHealth()).toMatchObject({
      state: "failed",
      lastError: "boom token=[REDACTED]",
    });
  });
});
