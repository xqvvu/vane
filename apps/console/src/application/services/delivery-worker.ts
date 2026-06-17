import "@tanstack/react-start/server-only";
import { redactText } from "@vane/core";
import type { DestinationSendContext, DestinationRegistry } from "@vane/destinations";

import {
  DeliveryExecution,
  type DeliveryBackoffOptions,
  type DeliveryExecutionOutcome,
} from "#/application/services/delivery-execution.ts";
import type { SqliteStore } from "#/infra/sqlite/store.ts";

export interface DeliveryWorkerOptions {
  store: SqliteStore;
  destinations: DestinationRegistry;
  sendContext?: DestinationSendContext;
  now?: () => string;
  batchSize?: number;
  staleRunningTimeoutMs?: number;
  backoff?: DeliveryBackoffOptions;
}

export interface DeliveryWorkerRunOptions {
  now?: string;
  limit?: number;
}

export interface DeliveryWorkerRunResult {
  claimed: number;
  reclaimed: number;
  succeeded: number;
  failed: number;
  retrying: number;
  startedAt: string;
  finishedAt: string;
}

export interface DeliveryWorkerHealthSnapshot {
  state: "idle" | "running" | "failed";
  lastStartedAt: string | null;
  lastFinishedAt: string | null;
  lastError: string | null;
  lastRun: DeliveryWorkerRunResult | null;
}

export class DeliveryWorker {
  private readonly store: SqliteStore;
  private readonly execution: DeliveryExecution;
  private readonly now: () => string;
  private readonly batchSize: number;
  private readonly staleRunningTimeoutMs: number;
  private readonly health: DeliveryWorkerHealthSnapshot = {
    state: "idle",
    lastStartedAt: null,
    lastFinishedAt: null,
    lastError: null,
    lastRun: null,
  };

  constructor(options: DeliveryWorkerOptions) {
    this.store = options.store;
    this.execution = new DeliveryExecution({
      store: options.store,
      destinations: options.destinations,
      sendContext: options.sendContext,
      backoff: options.backoff,
    });
    this.now = options.now ?? (() => new Date().toISOString());
    this.batchSize = options.batchSize ?? 10;
    this.staleRunningTimeoutMs = options.staleRunningTimeoutMs ?? 5 * 60_000;
  }

  getHealth(): DeliveryWorkerHealthSnapshot {
    return { ...this.health };
  }

  async runOnce(options: DeliveryWorkerRunOptions = {}): Promise<DeliveryWorkerRunResult> {
    const now = options.now ?? this.now();

    this.health.state = "running";
    this.health.lastStartedAt = now;
    this.health.lastError = null;

    try {
      const reclaimed = this.store.deliveries.reclaimStaleRunning({
        staleBefore: staleRunningCutoff(now, this.staleRunningTimeoutMs),
        now,
      });
      const claimed = this.store.deliveries.claimNext({
        now,
        limit: options.limit ?? this.batchSize,
      });
      const result: DeliveryWorkerRunResult = {
        claimed: claimed.length,
        reclaimed: reclaimed.reclaimed,
        succeeded: 0,
        failed: 0,
        retrying: 0,
        startedAt: now,
        finishedAt: now,
      };

      for (const delivery of claimed) {
        addOutcome(result, await this.execution.execute(delivery, now));
      }

      result.finishedAt = options.now ?? this.now();
      this.health.state = "idle";
      this.health.lastFinishedAt = result.finishedAt;
      this.health.lastRun = result;

      return result;
    } catch (error) {
      const finishedAt = options.now ?? this.now();

      this.health.state = "failed";
      this.health.lastFinishedAt = finishedAt;
      this.health.lastError = redactWorkerError(error);

      throw error;
    }
  }
}

function staleRunningCutoff(now: string, timeoutMs: number): string {
  return new Date(new Date(now).valueOf() - timeoutMs).toISOString();
}

function redactWorkerError(error: unknown): string {
  return redactText(error instanceof Error ? error.message : String(error));
}

function addOutcome(result: DeliveryWorkerRunResult, outcome: DeliveryExecutionOutcome): void {
  if (outcome === "succeeded") {
    result.succeeded += 1;
  } else if (outcome === "retrying") {
    result.retrying += 1;
  } else {
    result.failed += 1;
  }
}
