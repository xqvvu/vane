import type { ReactNode } from "react";

import { useTranslations } from "#/i18n/use-i18n.ts";

export function DestinationsPageToolbar({ actions }: { actions: ReactNode }) {
  const t = useTranslations();

  return (
    <header className="border-border bg-background flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center">
        <p className="text-muted-foreground text-sm">{t("destinations.page.description")}</p>
      </div>

      <div className="flex items-center gap-2">{actions}</div>
    </header>
  );
}
