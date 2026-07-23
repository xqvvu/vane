import type {
  DestinationSummary,
  DestinationTemplateDraftResult,
  JsonValue,
  NormalizedEvent,
  SourceSummary,
} from "@vane/core";
import type {
  DestinationRegistry,
  DestinationSendContext,
  TemplateContext,
  TemplateDiagnostic,
} from "@vane/destinations";

import type { SqliteStore } from "#/infra/sqlite/store";

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

export type DestinationTemplateDraft = DestinationTemplateDraftResult;

export interface DestinationPreviewResult {
  destination: DestinationSummary;
  renderedPayload: JsonValue;
  sample: DestinationPreviewSample;
  context: TemplateContext;
  normalizedEvent: NormalizedEvent;
  diagnostics: TemplateDiagnostic[];
  rawPayloadReference: DestinationPreviewRawPayloadReference | null;
}

export interface DestinationPreviewSample {
  kind: "built_in" | "historical_event";
  eventId: string;
  source: SourceSummary;
  receivedAt: string | null;
}

export interface DestinationPreviewRawPayloadReference {
  eventId: string;
  payload: JsonValue;
  headers: Record<string, string>;
}
