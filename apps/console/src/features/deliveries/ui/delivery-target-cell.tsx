import { useTranslations } from "#/i18n/use-i18n.ts";

export function DeliveryTargetCell({
  destinationName,
  routeName,
}: {
  destinationName: string;
  routeName: string | null;
}) {
  const t = useTranslations();

  return (
    <div className="min-w-0">
      <div className="truncate font-medium" title={destinationName}>
        {destinationName}
      </div>
      <div
        className="text-muted-foreground truncate text-[11px]"
        title={routeName ?? t("deliveries.table.manual")}
      >
        {routeName ?? t("deliveries.table.manual")}
      </div>
    </div>
  );
}
