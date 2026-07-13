import type { DestinationSummary, JsonValue, SourceSummary } from "@vane/core";
import type { DestinationCatalogItem } from "@vane/destinations";

export type { DestinationSummary };

export type DestinationCatalog = DestinationCatalogItem[];

export interface DestinationTestNotice {
  destination: DestinationSummary;
  success: boolean;
  statusCode: number | null;
  responseBody: string | null;
  error: string | null;
}

export interface DestinationPreviewNotice {
  destination: DestinationSummary;
  renderedPayload: JsonValue;
  sample?: {
    kind: "built_in" | "historical_event";
    eventId: string;
    source: SourceSummary;
    receivedAt: string | null;
  };
  context?: unknown;
  normalizedEvent?: unknown;
  diagnostics?: unknown;
  rawPayloadReference?: unknown;
}
