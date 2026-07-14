export const fallbackTimeZone = "UTC";

export function supportedTimeZones(): string[] {
  try {
    return [fallbackTimeZone, ...Intl.supportedValuesOf("timeZone")];
  } catch {
    return [fallbackTimeZone];
  }
}
