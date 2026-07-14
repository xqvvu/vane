import { z } from "zod";

export const VaneLocaleSchema = z.enum(["en-US", "zh-Hans"]);
export type VaneLocale = z.infer<typeof VaneLocaleSchema>;

export const DEFAULT_VANE_LOCALE: VaneLocale = "en-US";
export const DEFAULT_VANE_TIME_ZONE = "UTC";

export const IanaTimeZoneSchema = z.string().trim().min(1).refine(isValidIanaTimeZone, {
  message: "Time zone must be a valid IANA time zone",
});

export function isValidIanaTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}
