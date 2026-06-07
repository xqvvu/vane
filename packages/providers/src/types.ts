import type { JsonObject, NormalizedEvent, SourceProvider } from "@vane/core";

export interface ProviderParseInput {
  sourceId: string;
  sourceName: string;
  receivedAt: string;
  headers: Record<string, string>;
  payload: unknown;
}

export interface ProviderParseResult {
  normalized: NormalizedEvent;
  providerMetadata: JsonObject;
  idempotencyKey: string;
}

export interface ProviderParser {
  kind: SourceProvider;
  parse(input: ProviderParseInput): ProviderParseResult;
}
