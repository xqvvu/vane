import type { DestinationSummary, JsonValue } from "@vane/core";
import type { DestinationRegistry, DestinationSendContext } from "@vane/destinations";

import type { SqliteStore } from "#/infra/sqlite/store.ts";

export interface DestinationServiceOptions {
  store: SqliteStore;
  destinations: DestinationRegistry;
  destinationSendContext?: DestinationSendContext;
}

export interface DestinationTestResult {
  destination: DestinationSummary;
  success: boolean;
  statusCode: number | null;
  responseBody: string | null;
  error: string | null;
}

export interface DestinationPreviewResult {
  destination: DestinationSummary;
  renderedPayload: JsonValue;
}
