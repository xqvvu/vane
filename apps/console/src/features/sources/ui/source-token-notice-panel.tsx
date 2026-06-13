import { RiCloseLine, RiShieldCheckLine } from "@remixicon/react";

import { Button } from "#/components/ui/button.tsx";
import { sourceWebhookUrlFromPath } from "#/features/sources/model/source-webhook.ts";
import { useTranslations } from "#/i18n/use-i18n.ts";
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
  const t = useTranslations();
  const webhookUrl = sourceWebhookUrlFromPath(notice.webhookPath);

  return (
    <section className="border-l-primary bg-muted/50 mx-3 mt-4 border-l-4 p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <RiShieldCheckLine className="text-primary mt-0.5 size-4 shrink-0" aria-hidden />
          <div className="min-w-0">
            <h2 className="text-sm font-semibold">{t("sources.notice.createdTitle")}</h2>
            <p className="text-muted-foreground mt-1 text-xs">
              {t("sources.notice.createdDescription", { sourceName: notice.sourceName })}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            title={t("sources.notice.copyToken")}
            onClick={() => void copyText(notice.token)}
          >
            {t("sources.notice.copyToken")}
          </Button>
          <Button
            type="button"
            size="sm"
            title={t("sources.notice.copyUrl")}
            onClick={() => void copyText(webhookUrl)}
          >
            {t("sources.notice.copyUrl")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            title={t("sources.notice.dismiss")}
            onClick={onDismiss}
          >
            <RiCloseLine aria-hidden />
          </Button>
        </div>
      </div>
    </section>
  );
}
