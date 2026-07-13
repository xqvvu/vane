import { FilterRemove2, Play } from "reicon-react";

import { PageToolbar } from "#/components/common/page-toolbar.tsx";
import { Button } from "#/components/ui/button.tsx";
import { useTranslations } from "#/i18n/use-i18n.ts";

export function DeliveriesPageToolbar({
  pending,
  onRunWorker,
  onResetFilters,
}: {
  pending: boolean;
  onRunWorker: () => void;
  onResetFilters: () => void;
}) {
  const t = useTranslations();

  return (
    <PageToolbar
      description={t("deliveries.page.description")}
      actions={
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={onResetFilters}
            title={t("deliveries.page.resetTitle")}
          >
            <FilterRemove2 data-icon="inline-start" aria-hidden />
            {t("common.actions.resetFilters")}
          </Button>
          <Button
            type="button"
            variant="default"
            size="sm"
            disabled={pending}
            onClick={onRunWorker}
            title={t("deliveries.page.runWorkerTitle")}
          >
            <Play data-icon="inline-start" aria-hidden />
            {t("common.actions.runWorker")}
          </Button>
        </>
      }
    />
  );
}
