import type { DeliveryState } from "@vane/core";

import { Badge } from "#/components/ui/badge.tsx";
import type { DeliveryDetail } from "#/features/operations/model/operation-types.ts";

export function DeliveryStateBadge({ state }: { state: DeliveryState }) {
  return (
    <Badge
      variant={state === "failed" ? "destructive" : state === "succeeded" ? "default" : "secondary"}
    >
      {state}
    </Badge>
  );
}

export function DeliveryAttemptStateBadge({
  state,
}: {
  state: NonNullable<DeliveryDetail>["attempts"][number]["state"];
}) {
  return (
    <Badge
      variant={state === "failed" ? "destructive" : state === "succeeded" ? "default" : "secondary"}
    >
      {state}
    </Badge>
  );
}
