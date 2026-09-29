import { AppLocaleSchema } from "@vane/core";
import * as z from "zod";

/** Locale and time zone resolved for the current request. */
export const RequestLocaleOutputSchema = z.object({
  locale: AppLocaleSchema,
  timeZone: z.string().min(1),
});
