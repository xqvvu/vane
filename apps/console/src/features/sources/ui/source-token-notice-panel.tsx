import { X, ShieldCheck } from "reicon-react";
import { toast } from "sonner";

import { IconTooltip } from "#/components/common/icon-tooltip.tsx";
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
  const copyTokenLabel = t("sources.notice.copyToken");
  const copyUrlLabel = t("sources.notice.copyUrl");
  const dismissLabel = t("sources.notice.dismiss");

  return (
    <section className="border-l-primary bg-muted/50 border-l-4 p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <ShieldCheck className="text-primary mt-0.5 size-4 shrink-0" aria-hidden />
          <div className="min-w-0">
            <h2 className="text-sm font-semibold">{t("sources.notice.createdTitle")}</h2>
            <p className="text-muted-foreground mt-1 text-xs">
              {t("sources.notice.createdDescription", { sourceName: notice.sourceName })}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <IconTooltip label={copyTokenLabel}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-label={copyTokenLabel}
              onClick={async () => {
                try {
                  await copyText(notice.token);
                  toast.success(t("common.actions.copied"));
                } catch {
                  toast.success(t("common.actions.copyFailed"));
                }
              }}
            >
              {copyTokenLabel}
            </Button>
          </IconTooltip>
          <IconTooltip label={copyUrlLabel}>
            <Button
              type="button"
              size="sm"
              aria-label={copyUrlLabel}
              onClick={async () => {
                try {
                  await copyText(webhookUrl);
                  toast.success(t("common.actions.copied"));
                } catch {
                  toast.success(t("common.actions.copyFailed"));
                }
              }}
            >
              {copyUrlLabel}
            </Button>
          </IconTooltip>
          <IconTooltip label={dismissLabel}>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={dismissLabel}
              onClick={onDismiss}
            >
              <X aria-hidden />
            </Button>
          </IconTooltip>
        </div>
      </div>
    </section>
  );
}
