import { ArrowRight } from "reicon-react";

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "#/components/ui/empty.tsx";
import { useTranslations } from "#/i18n/use-i18n.ts";

export function DestinationsEmptyState() {
  const t = useTranslations();

  return (
    <Empty className="border-0 py-3">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <ArrowRight aria-hidden />
        </EmptyMedia>
        <EmptyTitle>{t("destinations.table.empty.title")}</EmptyTitle>
        <EmptyDescription>{t("destinations.table.empty.description")}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
