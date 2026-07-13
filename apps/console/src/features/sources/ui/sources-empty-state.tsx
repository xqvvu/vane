import { Plug } from "reicon-react";

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "#/components/ui/empty.tsx";
import { useTranslations } from "#/i18n/use-i18n.ts";

export function SourcesEmptyState() {
  const t = useTranslations();

  return (
    <Empty className="border-none p-4">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Plug aria-hidden />
        </EmptyMedia>
        <EmptyTitle>{t("sources.table.empty.title")}</EmptyTitle>
        <EmptyDescription>{t("sources.table.empty.description")}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>{t("sources.table.empty.content")}</EmptyContent>
    </Empty>
  );
}
