export function sourceWebhookPath(sourceId: string): string {
  return `/api/sources/${encodeURIComponent(sourceId)}/webhook`;
}
