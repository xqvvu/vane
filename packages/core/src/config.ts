import { z } from "zod";

import { DestinationKindSchema } from "#core/destination/destination";
import { JsonObjectSchema } from "#core/json";
import { AppLocaleSchema, IanaTimeZoneSchema } from "#core/presentation";
import {
  LabelMatchOperatorSchema,
  LabelMatcherSchema,
  RouteDefinitionSchema,
  RouteRuleSchema,
} from "#core/route/route";
import { SourceProviderSchema } from "#core/source/source";

export const PORTABLE_CONFIG_SCHEMA_VERSION = "vane.config.v1";

const NonEmptyConfigStringSchema = z.string().trim().min(1);
const EnvironmentVariableNameSchema = z
  .string()
  .trim()
  .min(1)
  .regex(/^[A-Za-z_][A-Za-z0-9_]*$/, "Secret environment references must be valid env names");
const SecretPathSchema = z
  .string()
  .trim()
  .min(1)
  .regex(
    /^[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)*$/,
    "Secret reference paths must use dot-separated config keys",
  )
  .refine(isSafeSecretPath, {
    message: "Secret reference paths must not use prototype-polluting keys",
  });

const UnsafeSecretPathSegments = new Set(["__proto__", "prototype", "constructor"]);

export const SecretReferenceSchema = z.strictObject({
  env: EnvironmentVariableNameSchema,
});

export const SecretReferencesSchema = z.record(SecretPathSchema, SecretReferenceSchema).default({});

export const PortableSettingsSchema = z.strictObject({
  schemaVersion: z.literal(PORTABLE_CONFIG_SCHEMA_VERSION),
  exportedAt: z.string().optional(),
  includeSecrets: z.literal(false),
  locale: AppLocaleSchema.default("en-US"),
  timeZone: IanaTimeZoneSchema.default("UTC"),
  rawPayloadRetentionDays: z.number().int().min(0).max(3650),
});

export const PortableSourceSchema = z.strictObject({
  id: NonEmptyConfigStringSchema,
  name: NonEmptyConfigStringSchema,
  provider: SourceProviderSchema,
  enabled: z.boolean(),
  config: JsonObjectSchema.default({}),
  secretRefs: SecretReferencesSchema,
});

export const PortableDestinationSchema = z.strictObject({
  id: NonEmptyConfigStringSchema,
  name: NonEmptyConfigStringSchema,
  kind: DestinationKindSchema,
  enabled: z.boolean(),
  config: JsonObjectSchema.default({}),
  secretRefs: SecretReferencesSchema,
});

export const PortableRouteSchema = z.strictObject({
  id: NonEmptyConfigStringSchema,
  name: NonEmptyConfigStringSchema,
  enabled: z.boolean(),
  rule: RouteRuleSchema,
  destinationIds: RouteDefinitionSchema.shape.destinationIds,
});

export const PortableConfigurationSchema = z.strictObject({
  settings: PortableSettingsSchema,
  sources: z.array(PortableSourceSchema).default([]),
  destinations: z.array(PortableDestinationSchema).default([]),
  routes: z.array(PortableRouteSchema).default([]),
});

const PortableTomlLabelMatcherSchema = z.strictObject({
  key: NonEmptyConfigStringSchema,
  operator: LabelMatchOperatorSchema.default("equals"),
  value: NonEmptyConfigStringSchema,
});

const PortableTomlRouteRuleSchema = z.strictObject({
  source_ids: z.array(NonEmptyConfigStringSchema).default([]),
  severities: RouteRuleSchema.shape.severities.default([]),
  statuses: RouteRuleSchema.shape.statuses.default([]),
  labels: z.array(PortableTomlLabelMatcherSchema).default([]),
  title_contains: z.array(NonEmptyConfigStringSchema).default([]),
  message_contains: z.array(NonEmptyConfigStringSchema).default([]),
});

const EmptyTomlRouteRule = {
  source_ids: [],
  severities: [],
  statuses: [],
  labels: [],
  title_contains: [],
  message_contains: [],
} satisfies z.output<typeof PortableTomlRouteRuleSchema>;

export const PortableTomlSettingsDocumentSchema = z.strictObject({
  schema_version: z.literal(PORTABLE_CONFIG_SCHEMA_VERSION),
  exported_at: z.string().optional(),
  include_secrets: z.literal(false),
  locale: AppLocaleSchema.default("en-US"),
  time_zone: IanaTimeZoneSchema.default("UTC"),
  raw_payload_retention_days: z.number().int().min(0).max(3650),
});

export const PortableTomlSourceDocumentSchema = z.strictObject({
  id: NonEmptyConfigStringSchema,
  name: NonEmptyConfigStringSchema,
  provider: SourceProviderSchema,
  enabled: z.boolean(),
  config: JsonObjectSchema.default({}),
  secret_refs: SecretReferencesSchema,
});

export const PortableTomlDestinationDocumentSchema = z.strictObject({
  id: NonEmptyConfigStringSchema,
  name: NonEmptyConfigStringSchema,
  kind: DestinationKindSchema,
  enabled: z.boolean(),
  config: JsonObjectSchema.default({}),
  secret_refs: SecretReferencesSchema,
});

export const PortableTomlRouteDocumentSchema = z.strictObject({
  id: NonEmptyConfigStringSchema,
  name: NonEmptyConfigStringSchema,
  enabled: z.boolean(),
  rule: PortableTomlRouteRuleSchema.default(EmptyTomlRouteRule),
  destination_ids: RouteDefinitionSchema.shape.destinationIds,
});

export const PortableTomlDocumentSchema = z.strictObject({
  settings: PortableTomlSettingsDocumentSchema,
  sources: z.array(PortableTomlSourceDocumentSchema).default([]),
  destinations: z.array(PortableTomlDestinationDocumentSchema).default([]),
  routes: z.array(PortableTomlRouteDocumentSchema).default([]),
});

export type SecretReference = z.infer<typeof SecretReferenceSchema>;
export type SecretReferences = z.infer<typeof SecretReferencesSchema>;
export type PortableSettings = z.infer<typeof PortableSettingsSchema>;
export type PortableSource = z.infer<typeof PortableSourceSchema>;
export type PortableDestination = z.infer<typeof PortableDestinationSchema>;
export type PortableRoute = z.infer<typeof PortableRouteSchema>;
export type PortableConfiguration = z.infer<typeof PortableConfigurationSchema>;
export type PortableTomlDocument = z.infer<typeof PortableTomlDocumentSchema>;

export function isSafeSecretPath(path: string): boolean {
  return path
    .split(".")
    .every((segment) => segment.length > 0 && !UnsafeSecretPathSegments.has(segment));
}

export function configurationToTomlDocument(
  configInput: PortableConfiguration,
): PortableTomlDocument {
  const config = PortableConfigurationSchema.parse(configInput);

  return PortableTomlDocumentSchema.parse({
    settings: {
      schema_version: config.settings.schemaVersion,
      exported_at: config.settings.exportedAt,
      include_secrets: config.settings.includeSecrets,
      locale: config.settings.locale,
      time_zone: config.settings.timeZone,
      raw_payload_retention_days: config.settings.rawPayloadRetentionDays,
    },
    sources: config.sources.map((source) => ({
      id: source.id,
      name: source.name,
      provider: source.provider,
      enabled: source.enabled,
      config: source.config,
      secret_refs: source.secretRefs,
    })),
    destinations: config.destinations.map((destination) => ({
      id: destination.id,
      name: destination.name,
      kind: destination.kind,
      enabled: destination.enabled,
      config: destination.config,
      secret_refs: destination.secretRefs,
    })),
    routes: config.routes.map((route) => ({
      id: route.id,
      name: route.name,
      enabled: route.enabled,
      rule: {
        source_ids: route.rule.sourceIds,
        severities: route.rule.severities,
        statuses: route.rule.statuses,
        labels: route.rule.labels,
        title_contains: route.rule.titleContains,
        message_contains: route.rule.messageContains,
      },
      destination_ids: route.destinationIds,
    })),
  });
}

export function tomlDocumentToConfiguration(documentInput: unknown): PortableConfiguration {
  const document = PortableTomlDocumentSchema.parse(documentInput);

  return PortableConfigurationSchema.parse({
    settings: {
      schemaVersion: document.settings.schema_version,
      exportedAt: document.settings.exported_at,
      includeSecrets: document.settings.include_secrets,
      locale: document.settings.locale,
      timeZone: document.settings.time_zone,
      rawPayloadRetentionDays: document.settings.raw_payload_retention_days,
    },
    sources: document.sources.map((source) => ({
      id: source.id,
      name: source.name,
      provider: source.provider,
      enabled: source.enabled,
      config: source.config,
      secretRefs: source.secret_refs,
    })),
    destinations: document.destinations.map((destination) => ({
      id: destination.id,
      name: destination.name,
      kind: destination.kind,
      enabled: destination.enabled,
      config: destination.config,
      secretRefs: destination.secret_refs,
    })),
    routes: document.routes.map((route) => ({
      id: route.id,
      name: route.name,
      enabled: route.enabled,
      rule: {
        sourceIds: route.rule.source_ids,
        severities: route.rule.severities,
        statuses: route.rule.statuses,
        labels: route.rule.labels.map((label) => LabelMatcherSchema.parse(label)),
        titleContains: route.rule.title_contains,
        messageContains: route.rule.message_contains,
      },
      destinationIds: route.destination_ids,
    })),
  });
}
