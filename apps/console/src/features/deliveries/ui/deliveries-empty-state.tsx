import { RiInboxArchiveLine } from "@remixicon/react";

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "#/components/ui/empty";
import { useTranslations } from "#/i18n/use-i18n";

export function DeliveriesEmptyState() {
  const t = useTranslations();

  return (
    <Empty className="border-none p-4">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <RiInboxArchiveLine aria-hidden />
        </EmptyMedia>
        <EmptyTitle>{t("deliveries.table.empty")}</EmptyTitle>
        <EmptyDescription>{t("deliveries.table.order")}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
