import { CopyableCodeLine } from "#/app/shell/copyable-code-line.tsx";
import { sourceWebhookUrlFromPath } from "#/features/sources/model/source-webhook.ts";

export interface SourceTokenNotice {
  sourceName: string;
  webhookPath: string;
  token: string;
}

export function SourceTokenNoticePanel({ notice }: { notice: SourceTokenNotice }) {
  return (
    <div className="border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-950">
      <div className="font-semibold">Source token for {notice.sourceName}</div>
      <div className="mt-2 grid gap-1">
        <div className="text-amber-800">Webhook URL</div>
        <CopyableCodeLine
          value={notice.webhookPath}
          copyValue={sourceWebhookUrlFromPath(notice.webhookPath)}
          title="Copy webhook URL"
        />
      </div>
      <div className="mt-2 grid gap-1">
        <div className="text-amber-800">Source token</div>
        <CopyableCodeLine
          value={notice.token}
          copyValue={notice.token}
          title="Copy source token"
          wrap
        />
      </div>
    </div>
  );
}
