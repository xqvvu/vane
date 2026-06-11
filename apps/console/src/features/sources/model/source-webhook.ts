export function sourceWebhookPath(sourceId: string): string {
  return `/api/sources/${encodeURIComponent(sourceId)}/webhook`;
}

export function sourceWebhookUrl(sourceId: string): string {
  return sourceWebhookUrlFromPath(sourceWebhookPath(sourceId));
}

export function sourceWebhookUrlFromPath(path: string): string {
  if (typeof window === "undefined") {
    return path;
  }

  return new URL(path, window.location.origin).toString();
}
