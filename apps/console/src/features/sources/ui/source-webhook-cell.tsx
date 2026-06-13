import { sourceWebhookPath, sourceWebhookUrl } from "#/features/sources/model/source-webhook.ts";
import { useTranslations } from "#/i18n/use-i18n.ts";
import { cn } from "#/lib/utils.ts";
import { CopyableCodeLine } from "#/shell/copyable-code-line.tsx";

export function SourceWebhookCell({
  sourceId,
  compact = false,
}: {
  sourceId: string;
  compact?: boolean;
}) {
  const t = useTranslations();
  const path = sourceWebhookPath(sourceId);

  if (compact) {
    return (
      <code
        className={cn(
          "border-border bg-muted/40 text-muted-foreground inline-block max-w-full truncate border px-1.5 py-0.5 font-mono text-[11px]",
        )}
        title={path}
      >
        {path}
      </code>
    );
  }

  return (
    <CopyableCodeLine
      value={path}
      copyValue={sourceWebhookUrl(sourceId)}
      title={t("sources.table.actions.copyWebhookUrl")}
      muted
    />
  );
}
