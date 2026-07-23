import type { DestinationRegistry } from "@vane/destinations";

import type { SqliteStore } from "#/infra/sqlite/store";

export interface ConfigPortabilityServiceOptions {
  store: SqliteStore;
  destinations: DestinationRegistry;
  generateSourceToken?: () => string;
}
