import { RiInboxArchiveLine } from "@remixicon/react";

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "#/components/ui/empty.tsx";
import { useTranslations } from "#/i18n/use-i18n.ts";

export function EventsEmptyState() {
  const t = useTranslations();

  return (
    <Empty className="border-none p-4">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <RiInboxArchiveLine aria-hidden />
        </EmptyMedia>
        <EmptyTitle>{t("events.table.empty")}</EmptyTitle>
        <EmptyDescription>{t("events.table.order")}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
