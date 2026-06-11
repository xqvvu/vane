export function formatTime(value: string): string {
  return value.slice(11, 16);
}

export function formatDateTime(value: string): string {
  return value.replace("T", " ").slice(0, 19);
}

export function summarizeResponseBody(value: string | null): string {
  if (!value?.trim()) {
    return "—";
  }

  const normalized = value.replaceAll(/\s+/g, " ").trim();
  return normalized.length > 120 ? `${normalized.slice(0, 117)}...` : normalized;
}
