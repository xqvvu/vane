import { RiCheckboxCircleLine, RiKey2Line } from "@remixicon/react";

import { Alert, AlertDescription, AlertTitle } from "#/components/ui/alert.tsx";
import type { ImportConfigurationResult } from "#/features/configuration/model/configuration-types.ts";
import {
  sourceWebhookPath,
  sourceWebhookUrlFromPath,
} from "#/features/sources/model/source-webhook.ts";
import { CopyableCodeLine } from "#/shell/copyable-code-line.tsx";

export function ImportNoticePanel({ notice }: { notice: ImportConfigurationResult }) {
  return (
    <Alert>
      <RiCheckboxCircleLine aria-hidden />
      <AlertTitle>Imported configuration</AlertTitle>
      <AlertDescription>
        {notice.generatedSourceTokens.length === 0
          ? "No new source tokens were generated."
          : "Copy generated source tokens now. They are shown once and token hashes are never displayed."}
      </AlertDescription>
      {notice.generatedSourceTokens.length === 0 ? null : (
        <div className="col-start-2 mt-2 grid gap-2">
          {notice.generatedSourceTokens.map((source) => {
            const webhookPath = sourceWebhookPath(source.sourceId);

            return (
              <div key={source.sourceId} className="border-border grid gap-1 border p-2">
                <div className="flex items-center gap-2 font-medium">
                  <RiKey2Line className="size-3.5" aria-hidden />
                  {source.sourceName}
                </div>
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
    </Alert>
  );
}
