import "@tanstack/react-start/server-only";
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
  backoff?: DeliveryBackoffOptions;
}

export interface DeliveryWorkerRunOptions {
  now?: string;
  limit?: number;
}

export interface DeliveryWorkerRunResult {
  claimed: number;
  succeeded: number;
  failed: number;
  retrying: number;
}

export class DeliveryWorker {
  private readonly store: SqliteStore;
  private readonly execution: DeliveryExecution;
  private readonly now: () => string;
  private readonly batchSize: number;

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
  }

  async runOnce(options: DeliveryWorkerRunOptions = {}): Promise<DeliveryWorkerRunResult> {
    const now = options.now ?? this.now();
    const claimed = this.store.deliveries.claimNext({
      now,
      limit: options.limit ?? this.batchSize,
    });
    const result: DeliveryWorkerRunResult = {
      claimed: claimed.length,
      succeeded: 0,
      failed: 0,
      retrying: 0,
    };

    for (const delivery of claimed) {
      addOutcome(result, await this.execution.execute(delivery, now));
    }

    return result;
  }
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
