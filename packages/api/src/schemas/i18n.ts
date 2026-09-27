import { VaneLocaleSchema } from "@vane/core";
import * as z from "zod";

/** Locale and time zone resolved for the current request. */
export const RequestLocaleOutputSchema = z.object({
  locale: VaneLocaleSchema,
  timeZone: z.string().min(1),
});
