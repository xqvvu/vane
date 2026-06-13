export { sourceWebhookPath } from "@vane/core";

import { sourceWebhookPath } from "@vane/core";

import { urlFromCurrentOrigin } from "#/lib/browser.ts";

export function sourceWebhookUrlFromPath(path: string): string {
  return urlFromCurrentOrigin(path);
}

export function sourceWebhookUrl(sourceId: string): string {
  return sourceWebhookUrlFromPath(sourceWebhookPath(sourceId));
}
