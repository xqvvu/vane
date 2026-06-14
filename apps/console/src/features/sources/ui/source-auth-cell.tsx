import { RiLockLine } from "@remixicon/react";

import { Badge } from "#/components/ui/badge.tsx";
import { useTranslations } from "#/i18n/use-i18n.ts";

export function SourceAuthCell() {
  const t = useTranslations();

  return (
    <div className="min-w-0">
      <Badge variant="outline" className="bg-muted/40 text-[11px] font-semibold">
        <RiLockLine data-icon="inline-start" aria-hidden />
        {t("sources.table.tokenConfigured")}
      </Badge>
    </div>
  );
}
