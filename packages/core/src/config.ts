import { z } from "zod";

import { DestinationKindSchema } from "#/destination/destination.ts";
import { JsonObjectSchema } from "#/json.ts";
import { IanaTimeZoneSchema, VaneLocaleSchema } from "#/presentation.ts";
import {
  LabelMatchOperatorSchema,
  LabelMatcherSchema,
  RouteDefinitionSchema,
  RouteRuleSchema,
} from "#/route/route.ts";
import { SourceProviderSchema } from "#/source/source.ts";

export const VANE_CONFIG_SCHEMA_VERSION = "vane.config.v1";

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
  .refine(isSafeVaneSecretPath, {
    message: "Secret reference paths must not use prototype-polluting keys",
  });

const UnsafeSecretPathSegments = new Set(["__proto__", "prototype", "constructor"]);

export const VaneSecretReferenceSchema = z.strictObject({
  env: EnvironmentVariableNameSchema,
});

export const VaneSecretReferencesSchema = z
  .record(SecretPathSchema, VaneSecretReferenceSchema)
  .default({});

export const VaneConfigSettingsSchema = z.strictObject({
  schemaVersion: z.literal(VANE_CONFIG_SCHEMA_VERSION),
  exportedAt: z.string().optional(),
  includeSecrets: z.literal(false),
  locale: VaneLocaleSchema.default("en-US"),
  timeZone: IanaTimeZoneSchema.default("UTC"),
  rawPayloadRetentionDays: z.number().int().min(0).max(3650),
});

export const VaneConfigSourceSchema = z.strictObject({
  id: NonEmptyConfigStringSchema,
  name: NonEmptyConfigStringSchema,
  provider: SourceProviderSchema,
  enabled: z.boolean(),
  config: JsonObjectSchema.default({}),
  secretRefs: VaneSecretReferencesSchema,
});

export const VaneConfigDestinationSchema = z.strictObject({
  id: NonEmptyConfigStringSchema,
  name: NonEmptyConfigStringSchema,
  kind: DestinationKindSchema,
  enabled: z.boolean(),
  config: JsonObjectSchema.default({}),
  secretRefs: VaneSecretReferencesSchema,
});

export const VaneConfigRouteSchema = z.strictObject({
  id: NonEmptyConfigStringSchema,
  name: NonEmptyConfigStringSchema,
  enabled: z.boolean(),
  rule: RouteRuleSchema,
  destinationIds: RouteDefinitionSchema.shape.destinationIds,
});

export const VaneConfigurationSchema = z.strictObject({
  settings: VaneConfigSettingsSchema,
  sources: z.array(VaneConfigSourceSchema).default([]),
  destinations: z.array(VaneConfigDestinationSchema).default([]),
  routes: z.array(VaneConfigRouteSchema).default([]),
});

const VaneTomlLabelMatcherSchema = z.strictObject({
  key: NonEmptyConfigStringSchema,
  operator: LabelMatchOperatorSchema.default("equals"),
  value: NonEmptyConfigStringSchema,
});

const VaneTomlRouteRuleSchema = z.strictObject({
  source_ids: z.array(NonEmptyConfigStringSchema).default([]),
  severities: RouteRuleSchema.shape.severities.default([]),
  statuses: RouteRuleSchema.shape.statuses.default([]),
  labels: z.array(VaneTomlLabelMatcherSchema).default([]),
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
} satisfies z.output<typeof VaneTomlRouteRuleSchema>;

export const VaneTomlSettingsDocumentSchema = z.strictObject({
  schema_version: z.literal(VANE_CONFIG_SCHEMA_VERSION),
  exported_at: z.string().optional(),
  include_secrets: z.literal(false),
  locale: VaneLocaleSchema.default("en-US"),
  time_zone: IanaTimeZoneSchema.default("UTC"),
  raw_payload_retention_days: z.number().int().min(0).max(3650),
});

export const VaneTomlSourceDocumentSchema = z.strictObject({
  id: NonEmptyConfigStringSchema,
  name: NonEmptyConfigStringSchema,
  provider: SourceProviderSchema,
  enabled: z.boolean(),
  config: JsonObjectSchema.default({}),
  secret_refs: VaneSecretReferencesSchema,
});

export const VaneTomlDestinationDocumentSchema = z.strictObject({
  id: NonEmptyConfigStringSchema,
  name: NonEmptyConfigStringSchema,
  kind: DestinationKindSchema,
  enabled: z.boolean(),
  config: JsonObjectSchema.default({}),
  secret_refs: VaneSecretReferencesSchema,
});

export const VaneTomlRouteDocumentSchema = z.strictObject({
  id: NonEmptyConfigStringSchema,
  name: NonEmptyConfigStringSchema,
  enabled: z.boolean(),
  rule: VaneTomlRouteRuleSchema.default(EmptyTomlRouteRule),
  destination_ids: RouteDefinitionSchema.shape.destinationIds,
});

export const VaneTomlDocumentSchema = z.strictObject({
  settings: VaneTomlSettingsDocumentSchema,
  sources: z.array(VaneTomlSourceDocumentSchema).default([]),
  destinations: z.array(VaneTomlDestinationDocumentSchema).default([]),
  routes: z.array(VaneTomlRouteDocumentSchema).default([]),
});

export type VaneSecretReference = z.infer<typeof VaneSecretReferenceSchema>;
export type VaneSecretReferences = z.infer<typeof VaneSecretReferencesSchema>;
export type VaneConfigSettings = z.infer<typeof VaneConfigSettingsSchema>;
export type VaneConfigSource = z.infer<typeof VaneConfigSourceSchema>;
export type VaneConfigDestination = z.infer<typeof VaneConfigDestinationSchema>;
export type VaneConfigRoute = z.infer<typeof VaneConfigRouteSchema>;
export type VaneConfiguration = z.infer<typeof VaneConfigurationSchema>;
export type VaneTomlDocument = z.infer<typeof VaneTomlDocumentSchema>;

export function isSafeVaneSecretPath(path: string): boolean {
  return path
    .split(".")
    .every((segment) => segment.length > 0 && !UnsafeSecretPathSegments.has(segment));
}

export function vaneConfigurationToTomlDocument(configInput: VaneConfiguration): VaneTomlDocument {
  const config = VaneConfigurationSchema.parse(configInput);

  return VaneTomlDocumentSchema.parse({
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

export function vaneTomlDocumentToConfiguration(documentInput: unknown): VaneConfiguration {
  const document = VaneTomlDocumentSchema.parse(documentInput);

  return VaneConfigurationSchema.parse({
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
