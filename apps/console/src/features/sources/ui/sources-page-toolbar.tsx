import type { ReactNode } from "react";

import { PageToolbar } from "#/components/common/page-toolbar.tsx";
import { useTranslations } from "#/i18n/use-i18n.ts";

export function SourcesPageToolbar({ actions }: { actions: ReactNode }) {
  const t = useTranslations();

  return <PageToolbar description={t("sources.page.description")} actions={actions} />;
}
