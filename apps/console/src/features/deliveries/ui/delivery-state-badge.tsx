import type { DeliveryState } from "@vane/core";

import { Badge } from "#/components/ui/badge.tsx";
import type { DeliveryDetail } from "#/features/operations/model/operation-types.ts";
import { useTranslations } from "#/i18n/use-i18n.ts";

export function DeliveryStateBadge({ state }: { state: DeliveryState }) {
  const t = useTranslations();

  return (
    <Badge
      variant={state === "failed" ? "destructive" : state === "succeeded" ? "default" : "secondary"}
    >
      {t(`common.deliveryState.${state}`)}
    </Badge>
  );
}

export function DeliveryAttemptStateBadge({
  state,
}: {
  state: NonNullable<DeliveryDetail>["attempts"][number]["state"];
}) {
  const t = useTranslations();

  return (
    <Badge
      variant={state === "failed" ? "destructive" : state === "succeeded" ? "default" : "secondary"}
    >
      {t(`common.deliveryState.${state}`)}
    </Badge>
  );
}
