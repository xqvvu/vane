import type {
  DestinationSummary,
  JsonObject,
  JsonValue,
  RouteDefinition,
  SourceSummary,
} from "@vane/core";

export interface Configuration {
  settings: {
    rawPayloadRetentionDays: number;
  };
  sources: SourceSummary[];
  destinations: DestinationSummary[];
  routes: RouteDefinition[];
}

export interface ImportConfigurationResult {
  generatedSourceTokens: Array<{
    sourceId: string;
    sourceName: string;
    token: string;
  }>;
}

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
}

export interface DestinationUpdateDraft {
  id: string;
  name: string;
  kind: DestinationSummary["kind"];
  config: JsonObject;
}
