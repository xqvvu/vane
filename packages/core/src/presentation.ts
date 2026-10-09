import { z } from "zod";

export const LocaleSchema = z.enum(["en-US", "zh-Hans"]);
export type Locale = z.infer<typeof LocaleSchema>;

export const DEFAULT_LOCALE: Locale = "en-US";
export const DEFAULT_TIME_ZONE = "UTC";

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
