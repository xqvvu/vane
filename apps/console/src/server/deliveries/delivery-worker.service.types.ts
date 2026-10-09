import type { DestinationRegistry, DestinationSendContext } from "@vane/destinations";

import type { SqliteStore } from "#/infra/sqlite/store";
import type { DeliveryBackoffOptions } from "#/server/deliveries/delivery-execution";
import type { DestinationConfigResolver } from "#/server/integrations/destination-config-resolver";

export interface DeliveryWorkerOptions {
  store: SqliteStore;
  destinations: DestinationRegistry;
  sendContext?: DestinationSendContext;
  now?: () => string;
  batchSize?: number;
  staleRunningTimeoutMs?: number;
  backoff?: DeliveryBackoffOptions;
  /** Resolves server-side references (for example a Feishu app credential) before each send. */
  resolveDestinationConfig?: DestinationConfigResolver;
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
