import {
  DestinationEditorDraftResultSchema,
  type DestinationEditorDraftResult,
} from "#core/destination/destination";
import type { Locale } from "#core/presentation";

export interface AppSettings {
  locale: Locale;
  timeZone: string;
  rawPayloadRetentionDays: number;
}

/** Template-only alias kept for older call sites; prefer DestinationEditorDraftResult. */
export const DestinationTemplateDraftResultSchema = DestinationEditorDraftResultSchema;
export type DestinationTemplateDraftResult = DestinationEditorDraftResult;

export interface ImportConfigurationResult {
  generatedSourceTokens: Array<{
    sourceId: string;
    sourceName: string;
    token: string;
  }>;
}

export { DestinationEditorDraftResultSchema, type DestinationEditorDraftResult };
