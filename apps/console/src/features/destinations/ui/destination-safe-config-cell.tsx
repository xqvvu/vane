import type { DestinationSummary } from "#/features/destinations/ui/destination-ui-types.ts";
import { useTranslations } from "#/i18n/use-i18n.ts";

export function DestinationSafeConfigCell({ destination }: { destination: DestinationSummary }) {
  const t = useTranslations();

  return (
    <div className="min-w-0">
      <div className="truncate text-xs">{t(`destinations.kinds.${destination.kind}`)}</div>
      <div
        className="text-muted-foreground mt-0.5 truncate text-[11px]"
        title={t(`destinations.table.safeConfig.${destination.kind}`)}
      >
        {t("destinations.table.safeConfig.secrets")}
      </div>
    </div>
  );
}
