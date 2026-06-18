import { SeverityBadge } from "#/features/events/ui/severity-badge.tsx";
import type { Operations } from "#/features/operations/model/operation-types.ts";

export function EventTitleCell({
  title,
  fingerprint,
  severity,
}: {
  title: string;
  fingerprint: string;
  severity: Operations["events"]["items"][number]["severity"];
}) {
  return (
    <div className="min-w-0">
      <div className="mb-1 flex min-w-0 items-center gap-1.5">
        <SeverityBadge severity={severity} />
        <span className="truncate font-medium" title={title}>
          {title}
        </span>
      </div>
      <div className="text-muted-foreground truncate text-[11px]" title={fingerprint}>
        {fingerprint}
      </div>
    </div>
  );
}
