import { RiCloseLine, RiShieldCheckLine } from "@remixicon/react";

import { Button } from "#/components/ui/button.tsx";
import { sourceWebhookUrlFromPath } from "#/features/sources/model/source-webhook.ts";
import { copyText } from "#/lib/browser.ts";

export interface SourceTokenNotice {
  sourceName: string;
  webhookPath: string;
  token: string;
}

export function SourceTokenNoticePanel({
  notice,
  onDismiss,
}: {
  notice: SourceTokenNotice;
  onDismiss: () => void;
}) {
  const webhookUrl = sourceWebhookUrlFromPath(notice.webhookPath);

  return (
    <section className="border-l-primary bg-muted/50 mx-3 mt-4 border-l-4 p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <RiShieldCheckLine className="text-primary mt-0.5 size-4 shrink-0" aria-hidden />
          <div className="min-w-0">
            <h2 className="text-sm font-semibold">Source created successfully</h2>
            <p className="text-muted-foreground mt-1 text-xs">
              Copy your webhook URL and token for {notice.sourceName}. These secrets will not be
              shown again.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            title="Copy source token"
            onClick={() => void copyText(notice.token)}
          >
            Copy Token
          </Button>
          <Button
            type="button"
            size="sm"
            title="Copy webhook URL"
            onClick={() => void copyText(webhookUrl)}
          >
            Copy URL
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            title="Dismiss notice"
            onClick={onDismiss}
          >
            <RiCloseLine aria-hidden />
          </Button>
        </div>
      </div>
    </section>
  );
}
