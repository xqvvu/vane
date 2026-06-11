import { CopyableCodeLine } from "#/app/shell/copyable-code-line.tsx";
import type { ImportConfigurationResult } from "#/features/configuration/model/configuration-types.ts";
import {
  sourceWebhookPath,
  sourceWebhookUrlFromPath,
} from "#/features/sources/model/source-webhook.ts";

export function ImportNoticePanel({ notice }: { notice: ImportConfigurationResult }) {
  return (
    <div className="border-border bg-card border px-3 py-2 text-xs">
      <div className="font-semibold">Imported configuration</div>
      {notice.generatedSourceTokens.length === 0 ? (
        <div className="text-muted-foreground mt-1">No new source tokens</div>
      ) : (
        <div className="mt-2 grid gap-2">
          {notice.generatedSourceTokens.map((source) => {
            const webhookPath = sourceWebhookPath(source.sourceId);

            return (
              <div key={source.sourceId} className="border-border grid gap-1 border p-2">
                <div className="font-medium">{source.sourceName}</div>
                <div className="text-muted-foreground">Webhook URL</div>
                <CopyableCodeLine
                  value={webhookPath}
                  copyValue={sourceWebhookUrlFromPath(webhookPath)}
                  title="Copy webhook URL"
                />
                <div className="text-muted-foreground">Source token</div>
                <CopyableCodeLine
                  value={source.token}
                  copyValue={source.token}
                  title="Copy source token"
                  wrap
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
