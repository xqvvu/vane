import { AppLocaleSchema, IanaTimeZoneSchema } from "@vane/core";
import * as z from "zod";

/** Console runtime settings owned by the dashboard operator. */
export const AppSettingsOutputSchema = z.object({
  locale: AppLocaleSchema,
  timeZone: IanaTimeZoneSchema,
  rawPayloadRetentionDays: z.number().int().min(0),
});
