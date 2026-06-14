import { sourceWebhookPath, sourceWebhookUrl } from "#/features/sources/model/source-webhook.ts";
import { useTranslations } from "#/i18n/use-i18n.ts";
import { CopyableCodeLine } from "#/shell/copyable-code-line.tsx";

export function SourceWebhookCell({ sourceId }: { sourceId: string }) {
  const t = useTranslations();
  const path = sourceWebhookPath(sourceId);

  return (
    <div className="mx-auto w-full max-w-72">
      <CopyableCodeLine
        value={path}
        copyValue={sourceWebhookUrl(sourceId)}
        copyLabel={t("sources.table.actions.copyWebhookUrl")}
        muted
        showToast
      />
    </div>
  );
}
