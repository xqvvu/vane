import * as z from "zod";

import { IanaTimeZoneSchema, VaneLocaleSchema } from "@vane/core";

/** Console runtime settings owned by the dashboard operator. */
export const AppSettingsOutputSchema = z.object({
  locale: VaneLocaleSchema,
  timeZone: IanaTimeZoneSchema,
  rawPayloadRetentionDays: z.number().int().min(0),
});

