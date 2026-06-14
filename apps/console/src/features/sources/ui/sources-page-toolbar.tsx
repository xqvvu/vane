import { RiRefreshLine } from "@remixicon/react";

import { Badge } from "#/components/ui/badge.tsx";
import { Button } from "#/components/ui/button.tsx";
import { SourcesAddDialog } from "#/features/sources/ui/source-add-dialog.tsx";
import type { SourceTokenNotice } from "#/features/sources/ui/source-token-notice-panel.tsx";
import { useTranslations } from "#/i18n/use-i18n.ts";

export function SourcesPageToolbar({
  sourceCount,
  pending,
  onSourceCreated,
  onRefresh,
}: {
  sourceCount: number;
  pending: boolean;
  onSourceCreated: (notice: SourceTokenNotice) => void;
  onRefresh: () => void;
}) {
  const t = useTranslations();

  return (
    <header className="border-border bg-background flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] font-bold tracking-wider uppercase">
            {t("sources.page.configured", { count: sourceCount })}
          </Badge>
        </div>
        <p className="text-muted-foreground text-sm">{t("sources.page.description")}</p>
      </div>

      <div className="flex items-center gap-2">
        <SourcesAddDialog disabled={pending} onCreated={onSourceCreated} />

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={onRefresh}
          title={t("sources.page.refreshTitle")}
          className="w-fit"
        >
          <RiRefreshLine data-icon="inline-start" aria-hidden />
          {t("common.actions.refresh")}
        </Button>
      </div>
    </header>
  );
}
