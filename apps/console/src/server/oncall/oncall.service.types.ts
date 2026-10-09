import type { ProviderReference } from "@vane/core";

import type { ClaimedDelivery } from "#/infra/sqlite/repositories/delivery/delivery.interface";
import type { SqliteStore } from "#/infra/sqlite/store";

export interface OncallServiceOptions {
  store: SqliteStore;
  /** Repeat pages for the same fingerprint are suppressed inside this window. */
  dedupeWindowMs?: number;
  now?: () => string;
}

export interface OncallPingTriggerInput {
  delivery: ClaimedDelivery;
  /** The message handle captured from the delivery's app send. */
  providerReference: ProviderReference;
  /** Defaults to the service clock. */
  now?: string;
}

export type OncallPingTrigger = (input: OncallPingTriggerInput) => Promise<void>;
