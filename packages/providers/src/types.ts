import {
  AdapterCatalogBaseSchema,
  AdapterConfigFieldSchema,
  AdapterConfigVersionSchema,
  AdapterLifecycleSchema,
  AdapterSecretFieldSchema,
  SourceProviderSchema,
} from "@vane/core";
import type {
  AdapterCatalogBase,
  AdapterConfigField,
  AdapterLifecycle,
  AdapterSecretField,
  JsonObject,
  JsonValue,
  NormalizedEvent,
  SourceProvider,
  SourceSummary,
} from "@vane/core";
import { z } from "zod";

export interface ProviderParseInput<Config = unknown> {
  source: SourceSummary;
  sourceId: string;
  sourceName: string;
  receivedAt: string;
  headers: Record<string, string>;
  payload: JsonValue;
  config: Config;
}

export type ProviderStandaloneParseInput<Config = unknown> = Omit<
  ProviderParseInput<Config>,
  "source" | "config"
> & {
  source?: SourceSummary;
  config?: Config;
};

export function completeProviderParseInput<Provider extends SourceProvider, Config>(
  provider: Provider,
  input: ProviderStandaloneParseInput<Config>,
  config: Config,
): ProviderParseInput<Config> {
  return {
    source: input.source ?? {
      id: input.sourceId,
      name: input.sourceName,
      provider,
      enabled: true,
    },
    sourceId: input.sourceId,
    sourceName: input.sourceName,
    receivedAt: input.receivedAt,
    headers: input.headers,
    payload: input.payload,
    config,
  };
}

export interface ProviderParseSuccess {
  ok: true;
  normalized: NormalizedEvent;
  providerMetadata: JsonObject;
  idempotencyKey: string;
}

export type ProviderParseFailureReason =
  | "invalid_payload"
  | "unsupported_payload"
  | "configuration_error"
  | "unknown_error";

export interface ProviderParseFailure {
  ok: false;
  reason: ProviderParseFailureReason;
  message: string;
  providerMetadata?: JsonObject;
}

export type ProviderParseResult = ProviderParseSuccess | ProviderParseFailure;

export type ProviderParseOutput = Omit<ProviderParseSuccess, "ok">;

export interface ProviderCapabilities {
  parse: boolean;
  testPayload: boolean;
  sourceToken: boolean;
  additionalSharedSecret: boolean;
}

export const ProviderCapabilitiesSchema = z.strictObject({
  parse: z.boolean(),
  testPayload: z.boolean(),
  sourceToken: z.boolean(),
  additionalSharedSecret: z.boolean(),
});

export interface ProviderManifest<Provider extends SourceProvider = SourceProvider> {
  provider: Provider;
  configVersion: number;
  lifecycle: AdapterLifecycle;
  displayNameKey: string;
  descriptionKey?: string;
  iconName?: string;
  configFields: AdapterConfigField[];
  secretFields: AdapterSecretField[];
  capabilities: ProviderCapabilities;
}

export const ProviderManifestSchema = z.strictObject({
  provider: SourceProviderSchema,
  configVersion: AdapterConfigVersionSchema,
  lifecycle: AdapterLifecycleSchema,
  displayNameKey: z.string().trim().min(1),
  descriptionKey: z.string().trim().min(1).optional(),
  iconName: z.string().trim().min(1).optional(),
  configFields: z.array(AdapterConfigFieldSchema),
  secretFields: z.array(AdapterSecretFieldSchema),
  capabilities: ProviderCapabilitiesSchema,
});

export interface ProviderCatalogItem<
  Provider extends SourceProvider = SourceProvider,
> extends AdapterCatalogBase {
  provider: Provider;
  capabilities: ProviderCapabilities;
}

export const ProviderCatalogItemSchema = AdapterCatalogBaseSchema.extend({
  provider: SourceProviderSchema,
  capabilities: ProviderCapabilitiesSchema,
});

export interface ProviderAdapter<
  Provider extends SourceProvider = SourceProvider,
  Config = unknown,
> {
  manifest: ProviderManifest<Provider>;
  configSchema: z.ZodType<Config>;
  parse(input: ProviderParseInput<Config>): ProviderParseResult;
}

export type ProviderParser<Config = unknown> = ProviderAdapter<SourceProvider, Config>;

export type ProviderAdapterDefinition<
  Provider extends SourceProvider,
  Schema extends z.ZodType<any, any>,
> = Omit<ProviderAdapter<Provider, z.output<Schema>>, "configSchema"> & {
  configSchema: Schema;
};

export function defineProviderAdapter<
  Provider extends SourceProvider,
  Schema extends z.ZodType<any, any>,
>(
  adapter: ProviderAdapterDefinition<Provider, Schema>,
): ProviderAdapter<Provider, z.output<Schema>> {
  return adapter as ProviderAdapter<Provider, z.output<Schema>>;
}

export function providerParseSucceeded(input: ProviderParseOutput): ProviderParseResult {
  return {
    ok: true,
    ...input,
  };
}

export function providerParseFailed(input: Omit<ProviderParseFailure, "ok">): ProviderParseResult {
  return {
    ok: false,
    ...input,
  };
}

export function unwrapProviderParseResult(result: ProviderParseResult): ProviderParseOutput {
  if (result.ok) {
    return {
      normalized: result.normalized,
      providerMetadata: result.providerMetadata,
      idempotencyKey: result.idempotencyKey,
    };
  }

  throw new Error(result.message);
}
