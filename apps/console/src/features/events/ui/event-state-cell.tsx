import { Badge } from "#/components/ui/badge.tsx";
import type { Operations } from "#/features/operations/model/operation-types.ts";
import { useTranslations } from "#/i18n/use-i18n.ts";

export function EventStateCell({
  status,
}: {
  status: Operations["events"]["items"][number]["status"];
}) {
  const t = useTranslations();

  return (
    <Badge variant={status === "firing" ? "destructive" : "secondary"}>
      {t(`common.alertStatus.${status}`)}
    </Badge>
  );
}
