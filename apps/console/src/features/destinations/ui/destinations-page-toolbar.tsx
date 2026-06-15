import { RiRefreshLine } from "@remixicon/react";
import type { ReactNode } from "react";

import { Badge } from "#/components/ui/badge.tsx";
import { Button } from "#/components/ui/button.tsx";
import { useTranslations } from "#/i18n/use-i18n.ts";

export function DestinationsPageToolbar({
  destinationCount,
  pending,
  actions,
  onRefresh,
}: {
  destinationCount: number;
  pending: boolean;
  actions?: ReactNode;
  onRefresh: () => void;
}) {
  const t = useTranslations();

  return (
    <header className="border-border bg-background flex flex-col gap-3 border-b px-3 py-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h1 className="font-heading text-2xl leading-none font-semibold">
            {t("destinations.page.title")}
          </h1>
          <Badge variant="outline" className="text-[10px] font-bold tracking-wider uppercase">
            {t("destinations.page.configured", { count: destinationCount })}
          </Badge>
        </div>
        <p className="text-muted-foreground mt-2 text-sm">{t("destinations.page.description")}</p>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        {actions}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={onRefresh}
          title={t("destinations.page.refreshTitle")}
          className="w-fit"
        >
          <RiRefreshLine data-icon="inline-start" aria-hidden />
          {t("common.actions.refresh")}
        </Button>
      </div>
    </header>
  );
}
