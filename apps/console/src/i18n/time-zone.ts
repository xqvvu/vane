export const fallbackTimeZone = "UTC";

export function detectRuntimeTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || fallbackTimeZone;
  } catch {
    return fallbackTimeZone;
  }
}
