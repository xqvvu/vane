import { z } from "zod";

import { JsonValueSchema } from "#core/json";

const UnsafeAdapterConfigPathSegments = new Set(["__proto__", "prototype", "constructor"]);

export const AdapterConfigPathSchema = z
  .string()
  .trim()
  .min(1)
  .regex(
    /^[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)*$/,
    "Adapter config paths must use dot-separated config keys",
  )
  .refine(isSafeAdapterConfigPath, {
    message: "Adapter config paths must not use prototype-polluting keys",
  });

export const AdapterConfigVersionSchema = z.number().int().min(1);

export const AdapterLifecycleStatusSchema = z.enum(["stable", "experimental", "deprecated"]);

export const AdapterLifecycleSchema = z.strictObject({
  status: AdapterLifecycleStatusSchema,
  replacementKind: z.string().trim().min(1).optional(),
  messageKey: z.string().trim().min(1).optional(),
});

export const AdapterSecretKindSchema = z.enum([
  "token",
  "webhook_url",
  "signing_secret",
  "password",
  "api_key",
  "endpoint_url",
  "header",
]);

export const AdapterSecretFieldSchema = z.strictObject({
  path: AdapterConfigPathSchema,
  kind: AdapterSecretKindSchema,
  envHint: z.string().trim().min(1).optional(),
  labelKey: z.string().trim().min(1).optional(),
});

const AdapterConfigFieldBaseSchema = z.strictObject({
  path: AdapterConfigPathSchema,
  labelKey: z.string().trim().min(1),
  descriptionKey: z.string().trim().min(1).optional(),
  placeholderKey: z.string().trim().min(1).optional(),
  required: z.boolean().optional(),
  sensitive: z.boolean().optional(),
  defaultValue: JsonValueSchema.optional(),
});

export const AdapterConfigSelectOptionSchema = z.strictObject({
  value: z.string().trim().min(1),
  labelKey: z.string().trim().min(1),
});

export const AdapterConfigHelpLinkSchema = z.strictObject({
  href: z.url(),
  labelKey: z.string().trim().min(1).optional(),
});

export const AdapterConfigHelpSchema = z
  .strictObject({
    show: z.boolean().optional(),
    labelKey: z.string().trim().min(1),
    descriptionKey: z.string().trim().min(1).optional(),
    links: z.array(AdapterConfigHelpLinkSchema).min(1).optional(),
  })
  .refine((help) => help.show === false || help.descriptionKey || help.links, {
    message: "Adapter config help must include description or links when shown",
  });

export const AdapterTextConfigFieldSchema = AdapterConfigFieldBaseSchema.extend({
  type: z.literal("text"),
});

export const AdapterTextareaConfigFieldSchema = AdapterConfigFieldBaseSchema.extend({
  type: z.literal("textarea"),
});

export const AdapterUrlConfigFieldSchema = AdapterConfigFieldBaseSchema.extend({
  type: z.literal("url"),
});

export const AdapterSecretConfigFieldSchema = AdapterConfigFieldBaseSchema.extend({
  type: z.literal("secret"),
});

export const AdapterPasswordConfigFieldSchema = AdapterConfigFieldBaseSchema.extend({
  type: z.literal("password"),
});

export const AdapterTemplateModeSchema = z.strictObject({
  mode: z.string().trim().min(1),
  labelKey: z.string().trim().min(1).optional(),
  descriptionKey: z.string().trim().min(1).optional(),
  help: AdapterConfigHelpSchema.optional(),
});

export const AdapterTemplateConfigFieldSchema = AdapterConfigFieldBaseSchema.extend({
  type: z.literal("template"),
  modes: z.array(AdapterTemplateModeSchema).min(1).optional(),
  help: AdapterConfigHelpSchema.optional(),
});

export const AdapterBooleanConfigFieldSchema = AdapterConfigFieldBaseSchema.extend({
  type: z.literal("boolean"),
});

export const AdapterNumberConfigFieldSchema = AdapterConfigFieldBaseSchema.extend({
  type: z.literal("number"),
  min: z.number().optional(),
  max: z.number().optional(),
  step: z.number().positive().optional(),
});

export const AdapterStringListConfigFieldSchema = AdapterConfigFieldBaseSchema.extend({
  type: z.literal("string-list"),
});

export const AdapterKeyValueConfigFieldSchema = AdapterConfigFieldBaseSchema.extend({
  type: z.literal("key-value"),
  valueSensitive: z.boolean().optional(),
});

export const AdapterSelectConfigFieldSchema = AdapterConfigFieldBaseSchema.extend({
  type: z.literal("select"),
  options: z.array(AdapterConfigSelectOptionSchema).min(1),
});

export const AdapterConfigFieldSchema = z.discriminatedUnion("type", [
  AdapterTextConfigFieldSchema,
  AdapterTextareaConfigFieldSchema,
  AdapterUrlConfigFieldSchema,
  AdapterSecretConfigFieldSchema,
  AdapterPasswordConfigFieldSchema,
  AdapterTemplateConfigFieldSchema,
  AdapterBooleanConfigFieldSchema,
  AdapterNumberConfigFieldSchema,
  AdapterStringListConfigFieldSchema,
  AdapterKeyValueConfigFieldSchema,
  AdapterSelectConfigFieldSchema,
]);

export const AdapterCatalogBaseSchema = z.strictObject({
  configVersion: AdapterConfigVersionSchema,
  lifecycle: AdapterLifecycleSchema,
  displayNameKey: z.string().trim().min(1),
  descriptionKey: z.string().trim().min(1).optional(),
  iconName: z.string().trim().min(1).optional(),
  configFields: z.array(AdapterConfigFieldSchema),
});

export type AdapterConfigPath = z.infer<typeof AdapterConfigPathSchema>;
export type AdapterConfigVersion = z.infer<typeof AdapterConfigVersionSchema>;
export type AdapterLifecycleStatus = z.infer<typeof AdapterLifecycleStatusSchema>;
export type AdapterLifecycle = z.infer<typeof AdapterLifecycleSchema>;
export type AdapterSecretKind = z.infer<typeof AdapterSecretKindSchema>;
export type AdapterSecretField = z.infer<typeof AdapterSecretFieldSchema>;
export type AdapterConfigSelectOption = z.infer<typeof AdapterConfigSelectOptionSchema>;
export type AdapterConfigHelpLink = z.infer<typeof AdapterConfigHelpLinkSchema>;
export type AdapterConfigHelp = z.infer<typeof AdapterConfigHelpSchema>;
export type AdapterTemplateMode = z.infer<typeof AdapterTemplateModeSchema>;
export type AdapterTemplateConfigField = z.infer<typeof AdapterTemplateConfigFieldSchema>;
export type AdapterConfigField = z.infer<typeof AdapterConfigFieldSchema>;
export type AdapterCatalogBase = z.infer<typeof AdapterCatalogBaseSchema>;

export function defineAdapterTemplateConfigField<const Field extends AdapterTemplateConfigField>(
  field: Field,
): Field {
  return field;
}

export function isSafeAdapterConfigPath(path: string): boolean {
  return path
    .split(".")
    .every((segment) => segment.length > 0 && !UnsafeAdapterConfigPathSegments.has(segment));
}
