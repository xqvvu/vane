import { z } from "zod";

import { DestinationKindSchema } from "#/destination/destination.ts";
import { JsonObjectSchema } from "#/json.ts";
import { RouteDefinitionSchema } from "#/route/route.ts";
import { SourceProviderSchema } from "#/source/source.ts";

export const CreateSourceCommandSchema = z.object({
  name: z.string().trim().min(1),
  provider: SourceProviderSchema,
  enabled: z.boolean().default(true),
  config: JsonObjectSchema.default({}),
});

export const UpdateSourceCommandSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).optional(),
  provider: SourceProviderSchema.optional(),
  enabled: z.boolean().optional(),
  config: JsonObjectSchema.optional(),
});

export const RotateSourceTokenCommandSchema = z.object({
  id: z.string().min(1),
});

export const CreateDestinationCommandSchema = z.object({
  name: z.string().trim().min(1),
  kind: DestinationKindSchema,
  enabled: z.boolean().default(true),
  config: JsonObjectSchema.default({}),
  secretRefs: JsonObjectSchema.default({}),
});

export const UpdateDestinationCommandSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).optional(),
  kind: DestinationKindSchema.optional(),
  enabled: z.boolean().optional(),
  config: JsonObjectSchema.optional(),
  secretRefs: JsonObjectSchema.optional(),
});

export const TestDestinationCommandSchema = z.object({
  id: z.string().min(1),
});

export const PreviewDestinationCommandSchema = z.object({
  id: z.string().min(1),
  sampleEventId: z.string().min(1).optional(),
});

export const PreviewDestinationDraftCommandSchema = z.object({
  name: z.string().trim().min(1),
  kind: DestinationKindSchema,
  config: JsonObjectSchema.default({}),
  sampleEventId: z.string().min(1).optional(),
});

export const PreviewDestinationUpdateCommandSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).optional(),
  config: JsonObjectSchema.default({}),
  sampleEventId: z.string().min(1).optional(),
});

export const ExportConfigurationCommandSchema = z
  .object({
    includeSecrets: z.literal(false).optional(),
  })
  .default({});

export const ImportConfigurationCommandSchema = z.object({
  toml: z.string().min(1),
});

export const UpdateAppSettingsCommandSchema = z.object({
  rawPayloadRetentionDays: z.number().int().min(0).max(3650),
});

export const CreateRouteCommandSchema = z.object({
  name: z.string().trim().min(1),
  enabled: z.boolean().default(true),
  rule: RouteDefinitionSchema.shape.rule.optional(),
  destinationIds: RouteDefinitionSchema.shape.destinationIds,
});

export const UpdateRouteCommandSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).optional(),
  enabled: z.boolean().optional(),
  rule: RouteDefinitionSchema.shape.rule.optional(),
  destinationIds: RouteDefinitionSchema.shape.destinationIds.optional(),
});

export type CreateSourceCommand = z.input<typeof CreateSourceCommandSchema>;
export type UpdateSourceCommand = z.input<typeof UpdateSourceCommandSchema>;
export type RotateSourceTokenCommand = z.input<typeof RotateSourceTokenCommandSchema>;
export type CreateDestinationCommand = z.input<typeof CreateDestinationCommandSchema>;
export type UpdateDestinationCommand = z.input<typeof UpdateDestinationCommandSchema>;
export type TestDestinationCommand = z.input<typeof TestDestinationCommandSchema>;
export type PreviewDestinationCommand = z.input<typeof PreviewDestinationCommandSchema>;
export type PreviewDestinationDraftCommand = z.input<typeof PreviewDestinationDraftCommandSchema>;
export type PreviewDestinationUpdateCommand = z.input<typeof PreviewDestinationUpdateCommandSchema>;
export type ExportConfigurationCommand = z.input<typeof ExportConfigurationCommandSchema>;
export type ImportConfigurationCommand = z.input<typeof ImportConfigurationCommandSchema>;
export type UpdateAppSettingsCommand = z.input<typeof UpdateAppSettingsCommandSchema>;
export type CreateRouteCommand = z.input<typeof CreateRouteCommandSchema>;
export type UpdateRouteCommand = z.input<typeof UpdateRouteCommandSchema>;
