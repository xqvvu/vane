import type { DestinationRegistry } from "@vane/destinations";

import type { SqliteStore } from "#/infra/sqlite/store.ts";

export interface ConfigPortabilityServiceOptions {
  store: SqliteStore;
  destinations: DestinationRegistry;
  generateSourceToken?: () => string;
}
