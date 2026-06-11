import type {
  DestinationKind,
  DestinationSummary,
  JsonValue,
  NormalizedEvent,
  SourceSummary,
} from "@vane/core";
import type { z } from "zod";

export interface FetchLikeResponse {
  ok: boolean;
  status: number;
  text(): Promise<string>;
}

export type FetchLike = (url: string, init: RequestInit) => Promise<FetchLikeResponse>;

export interface DestinationSendInput<Config> {
  eventId: string;
  source: SourceSummary;
  destination: DestinationSummary;
  normalizedEvent: NormalizedEvent;
  config: Config;
}

export interface DestinationSendContext {
  fetch?: FetchLike;
}

export interface DestinationSendResult {
  success: boolean;
  statusCode: number | null;
  responseBody: string | null;
  error: string | null;
  renderedPayload: JsonValue;
}

export interface DestinationSender<Config = unknown> {
  kind: DestinationKind;
  configSchema: z.ZodType<Config>;
  preview(input: DestinationSendInput<Config>): Promise<JsonValue> | JsonValue;
  send(
    input: DestinationSendInput<Config>,
    context?: DestinationSendContext,
  ): Promise<DestinationSendResult>;
}
