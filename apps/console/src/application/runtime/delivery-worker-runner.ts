import "@tanstack/react-start/server-only";
import type {
  DeliveryWorkerRunOptions,
  DeliveryWorkerRunResult,
} from "#/application/services/delivery-worker.ts";

export interface DeliveryWorkerTimer {
  unref?: () => void;
}

export type DeliveryWorkerSetInterval = (
  callback: () => void,
  intervalMs: number,
) => DeliveryWorkerTimer;

export type DeliveryWorkerClearInterval = (timer: DeliveryWorkerTimer) => void;

export interface RunnableDeliveryWorker {
  runOnce(options?: DeliveryWorkerRunOptions): Promise<DeliveryWorkerRunResult>;
}

export interface DeliveryWorkerRunnerOptions {
  worker: RunnableDeliveryWorker;
  intervalMs?: number;
  limit?: number;
  setIntervalFn?: DeliveryWorkerSetInterval;
  clearIntervalFn?: DeliveryWorkerClearInterval;
  onError?: (error: unknown) => void;
}

export interface DeliveryWorkerRunner {
  runNow(): Promise<DeliveryWorkerRunResult | null>;
  stop(): void;
}

export function createDeliveryWorkerRunner(
  options: DeliveryWorkerRunnerOptions,
): DeliveryWorkerRunner {
  const intervalMs = options.intervalMs ?? 5_000;
  const setIntervalFn =
    options.setIntervalFn ??
    ((callback, intervalMs) => setInterval(callback, intervalMs) as DeliveryWorkerTimer);
  const clearIntervalFn =
    options.clearIntervalFn ?? ((timer) => clearInterval(timer as ReturnType<typeof setInterval>));
  let running: Promise<DeliveryWorkerRunResult> | null = null;

  async function runNow(): Promise<DeliveryWorkerRunResult | null> {
    if (running) {
      return null;
    }

    running = options.worker.runOnce({
      limit: options.limit,
    });

    try {
      return await running;
    } catch (error) {
      options.onError?.(error);
      return null;
    } finally {
      running = null;
    }
  }

  const timer = setIntervalFn(() => {
    void runNow();
  }, intervalMs);

  timer.unref?.();

  return {
    runNow,
    stop() {
      clearIntervalFn(timer);
    },
  };
}
