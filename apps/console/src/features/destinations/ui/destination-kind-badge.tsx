import { Badge } from "#/components/ui/badge";
import type { DestinationFormKind } from "#/features/destinations/model/destination-form";
import { useTranslations } from "#/i18n/use-i18n";

export function DestinationKindBadge({ kind }: { kind: DestinationFormKind }) {
  const t = useTranslations();

  return (
    <Badge variant="outline" className="max-w-full truncate font-normal">
      {t(`destinations.kinds.${kind}`)}
    </Badge>
  );
}
