import type { DestinationSummary, RouteDefinition, SourceSummary } from "@vane/core";
import type { DestinationRegistry } from "@vane/destinations";
import type { ProviderRegistry } from "@vane/providers";

import type { SqliteStore } from "#/infra/sqlite/store.ts";

export interface ConfigPortabilityServiceOptions {
  store: SqliteStore;
  providers?: ProviderRegistry;
  destinations: DestinationRegistry;
  generateSourceToken?: () => string;
}

export interface ConfigurationSnapshot {
  settings: {
    rawPayloadRetentionDays: number;
  };
  sources: SourceSummary[];
  destinations: DestinationSummary[];
  routes: RouteDefinition[];
}
