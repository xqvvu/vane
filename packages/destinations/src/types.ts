import {
  AdapterCatalogBaseSchema,
  AdapterConfigFieldSchema,
  AdapterConfigVersionSchema,
  AdapterLifecycleSchema,
  AdapterSecretFieldSchema,
  DestinationKindSchema,
} from "@vane/core";
import type {
  AdapterCatalogBase,
  AdapterConfigField,
  AdapterLifecycle,
  AdapterSecretField,
  DestinationKind,
  DestinationSummary,
  JsonValue,
  NormalizedEvent,
  SourceSummary,
} from "@vane/core";
import { z } from "zod";

export interface FetchLikeResponse {
  ok: boolean;
  status: number;
  text(): Promise<string>;
}

export type FetchLike = (url: string, init: RequestInit) => Promise<FetchLikeResponse>;

export interface DestinationRenderInput<Config> {
  eventId: string;
  source: SourceSummary;
  destination: DestinationSummary;
  normalizedEvent: NormalizedEvent;
  config: Config;
}

export interface DestinationTransportContext {
  fetch?: FetchLike;
  now?: () => Date;
}

export type DestinationSendContext = DestinationTransportContext;
export type DestinationSendInput<Config> = DestinationRenderInput<Config>;

export type DestinationErrorKind =
  | "http_error"
  | "target_rejected"
  | "network_error"
  | "timeout"
  | "configuration_error"
  | "unknown_error";

export type DestinationRetryHint = "retryable" | "not_retryable" | "unknown";

export interface DestinationSendResultBase {
  statusCode: number | null;
  responseBody: string | null;
  renderedPayload: JsonValue;
}

export type DestinationSendResult =
  | (DestinationSendResultBase & {
      ok: true;
    })
  | (DestinationSendResultBase & {
      ok: false;
      errorKind: DestinationErrorKind;
      retryHint: DestinationRetryHint;
      errorMessage: string;
    });

export interface DestinationCapabilities {
  preview: boolean;
  test: boolean;
  delivery: boolean;
}

export const DestinationCapabilitiesSchema = z.strictObject({
  preview: z.boolean(),
  test: z.boolean(),
  delivery: z.boolean(),
});

export interface DestinationManifest<Kind extends DestinationKind = DestinationKind> {
  kind: Kind;
  configVersion: number;
  lifecycle: AdapterLifecycle;
  displayNameKey: string;
  descriptionKey?: string;
  iconName?: string;
  configFields: AdapterConfigField[];
  secretFields: AdapterSecretField[];
  capabilities: DestinationCapabilities;
}

export const DestinationManifestSchema = z.strictObject({
  kind: DestinationKindSchema,
  configVersion: AdapterConfigVersionSchema,
  lifecycle: AdapterLifecycleSchema,
  displayNameKey: z.string().trim().min(1),
  descriptionKey: z.string().trim().min(1).optional(),
  iconName: z.string().trim().min(1).optional(),
  configFields: z.array(AdapterConfigFieldSchema),
  secretFields: z.array(AdapterSecretFieldSchema),
  capabilities: DestinationCapabilitiesSchema,
});

export interface DestinationCatalogItem<
  Kind extends DestinationKind = DestinationKind,
> extends AdapterCatalogBase {
  kind: Kind;
  capabilities: DestinationCapabilities;
}

export const DestinationCatalogItemSchema = AdapterCatalogBaseSchema.extend({
  kind: DestinationKindSchema,
  capabilities: DestinationCapabilitiesSchema,
});

export interface DestinationAdapter<
  Kind extends DestinationKind = DestinationKind,
  Config = unknown,
> {
  manifest: DestinationManifest<Kind>;
  configSchema: z.ZodType<Config>;
  preview(input: DestinationRenderInput<Config>): Promise<JsonValue> | JsonValue;
  send(
    input: DestinationRenderInput<Config>,
    context?: DestinationTransportContext,
  ): Promise<DestinationSendResult>;
}

export type DestinationSender<Config = unknown> = DestinationAdapter<DestinationKind, Config>;

export type DestinationAdapterDefinition<
  Kind extends DestinationKind,
  Schema extends z.ZodType<any, any>,
> = Omit<DestinationAdapter<Kind, z.output<Schema>>, "configSchema"> & {
  configSchema: Schema;
};

export function defineDestinationAdapter<
  Kind extends DestinationKind,
  Schema extends z.ZodType<any, any>,
>(adapter: DestinationAdapterDefinition<Kind, Schema>): DestinationAdapter<Kind, z.output<Schema>> {
  return adapter as DestinationAdapter<Kind, z.output<Schema>>;
}

export function resolveDestinationTransportContext(
  context: DestinationTransportContext = {},
): Required<DestinationTransportContext> {
  return {
    fetch: context.fetch ?? getGlobalFetch(),
    now: context.now ?? (() => new Date()),
  };
}

function getGlobalFetch(): FetchLike {
  if (!globalThis.fetch) {
    throw new Error("No fetch implementation is available for destination delivery");
  }

  return globalThis.fetch;
}
