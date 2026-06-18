import { Badge } from "#/components/ui/badge.tsx";
import type { EventDetailData } from "#/features/events/ui/event-detail-types.ts";
import { useTranslations } from "#/i18n/use-i18n.ts";

export function EventLabelList({
  labels,
}: {
  labels: EventDetailData["event"]["normalized"]["labels"];
}) {
  const t = useTranslations();
  const entries = Object.entries(labels);

  return (
    <div className="border-border border-t p-3">
      <div className="text-muted-foreground mb-2 text-[11px]">
        {t("events.detail.terms.labels")}
      </div>
      {entries.length === 0 ? (
        <p className="text-muted-foreground text-xs">{t("events.detail.empty.labels")}</p>
      ) : (
        <div className="flex flex-wrap gap-1">
          {entries.map(([key, value]) => (
            <Badge
              key={key}
              variant="outline"
              className="max-w-full justify-start font-mono text-[11px]"
              title={`${key}=${value}`}
            >
              <span className="text-muted-foreground">{key}=</span>
              <span className="truncate">{value}</span>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
