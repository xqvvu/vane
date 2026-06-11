import { CopyableCodeLine } from "#/app/shell/copyable-code-line.tsx";
import { sourceWebhookPath, sourceWebhookUrl } from "#/features/sources/model/source-webhook.ts";

export function SourceWebhookCell({ sourceId }: { sourceId: string }) {
  const path = sourceWebhookPath(sourceId);

  return (
    <CopyableCodeLine
      value={path}
      copyValue={sourceWebhookUrl(sourceId)}
      title="Copy webhook URL"
      muted
    />
  );
}
