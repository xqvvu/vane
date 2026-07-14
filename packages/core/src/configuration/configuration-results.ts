import type { DestinationKind } from "#/destination/destination.ts";
import type { JsonObject } from "#/json.ts";
import type { VaneLocale } from "#/presentation.ts";

export interface AppSettings {
  locale: VaneLocale;
  timeZone: string;
  rawPayloadRetentionDays: number;
}

export interface DestinationTemplateDraftResult {
  destinationId: string;
  kind: DestinationKind;
  template: JsonObject | null;
}

export interface ImportConfigurationResult {
  generatedSourceTokens: Array<{
    sourceId: string;
    sourceName: string;
    token: string;
  }>;
}
