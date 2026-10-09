import { z } from "zod";

const NonEmptyFeishuAppStringSchema = z.string().trim().min(1);

/**
 * A Feishu self-built app (飞书应用) registered once and referenced by app-mode
 * Feishu destinations.
 *
 * `appSecret` never leaves the server: list/detail DTOs use
 * {@link FeishuAppSummarySchema}, and portable configuration exports replace the
 * secret with a `secretRefs` environment reference.
 */
export const FeishuAppSchema = z.strictObject({
  id: NonEmptyFeishuAppStringSchema,
  name: NonEmptyFeishuAppStringSchema,
  appId: NonEmptyFeishuAppStringSchema,
  appSecret: z.string().min(1),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type FeishuApp = z.output<typeof FeishuAppSchema>;

/** Client-safe app projection: everything except the secret. */
export const FeishuAppSummarySchema = FeishuAppSchema.omit({ appSecret: true });
export type FeishuAppSummary = z.output<typeof FeishuAppSummarySchema>;

/** A destination that references this app, used for the referenced-by column and delete refusal. */
export const FeishuAppReferenceSchema = z.strictObject({
  destinationId: NonEmptyFeishuAppStringSchema,
  destinationName: NonEmptyFeishuAppStringSchema,
});
export type FeishuAppReference = z.output<typeof FeishuAppReferenceSchema>;

export const FeishuAppListItemSchema = FeishuAppSummarySchema.extend({
  referencedDestinations: z.array(FeishuAppReferenceSchema),
});
export type FeishuAppListItem = z.output<typeof FeishuAppListItemSchema>;

export const FeishuAppTestResultSchema = z.strictObject({
  success: z.boolean(),
  appName: z.string(),
  errorMessage: z.string().nullable(),
});
export type FeishuAppTestResult = z.output<typeof FeishuAppTestResultSchema>;
