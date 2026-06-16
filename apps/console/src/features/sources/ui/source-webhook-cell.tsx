import * as React from "react";

import { CopyableCodeLine } from "#/components/common/copyable-code-line.tsx";
import {
  sourceWebhookPath,
  sourceWebhookUrlFromPath,
} from "#/features/sources/model/source-webhook.ts";
import { useTranslations } from "#/i18n/use-i18n.ts";

export function SourceWebhookCell({ sourceId }: { sourceId: string }) {
  const t = useTranslations();
  const path = sourceWebhookPath(sourceId);
  const url = useResolvedWebhookUrl(path);

  return (
    <div className="mx-auto w-full max-w-72">
      <CopyableCodeLine
        value={path}
        copyValue={url}
        copyLabel={t("sources.table.actions.copyWebhookUrl")}
        tooltipValue={url}
        muted
        showToast
      />
    </div>
  );
}

function useResolvedWebhookUrl(path: string): string {
  const [url, setUrl] = React.useState(path);

  React.useEffect(() => {
    setUrl(sourceWebhookUrlFromPath(path));
  }, [path]);

  return url;
}
