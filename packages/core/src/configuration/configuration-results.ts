import type { DestinationKind } from "#core/destination/destination";
import type { JsonObject } from "#core/json";
import type { VaneLocale } from "#core/presentation";

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
