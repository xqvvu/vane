import { FilterRemove2, Refresh } from "reicon-react";

import { PageToolbar } from "#/components/common/page-toolbar.tsx";
import { Button } from "#/components/ui/button.tsx";
import { useTranslations } from "#/i18n/use-i18n.ts";

export function EventsPageToolbar({
  pending,
  onRefresh,
  onResetFilters,
}: {
  pending: boolean;
  onRefresh: () => void;
  onResetFilters: () => void;
}) {
  const t = useTranslations();

  return (
    <PageToolbar
      description={t("events.page.description")}
      actions={
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={onRefresh}
            title={t("events.page.refreshTitle")}
          >
            <Refresh data-icon="inline-start" aria-hidden />
            {t("common.actions.refresh")}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={onResetFilters}
            title={t("events.page.resetTitle")}
          >
            <FilterRemove2 data-icon="inline-start" aria-hidden />
            {t("common.actions.resetFilters")}
          </Button>
        </>
      }
    />
  );
}
