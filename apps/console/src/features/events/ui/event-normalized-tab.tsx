import { EventDetailSectionHeader } from "#/features/events/ui/event-detail-section-header.tsx";
import { EventDetailTerm } from "#/features/events/ui/event-detail-term.tsx";
import type { EventDetailData } from "#/features/events/ui/event-detail-types.ts";
import { EventJsonBlock } from "#/features/events/ui/event-json-block.tsx";
import { EventLabelList } from "#/features/events/ui/event-label-list.tsx";
import { OperationTimestamp } from "#/features/operations/ui/operation-timestamp.tsx";
import { useTranslations } from "#/i18n/use-i18n.ts";

export function EventNormalizedTab({ detail }: { detail: EventDetailData }) {
  const t = useTranslations();
  const normalized = detail.event.normalized;

  return (
    <div className="grid h-full min-h-0 gap-3 lg:grid-cols-[minmax(18rem,0.85fr)_minmax(0,1.15fr)]">
      <section className="border-border bg-background flex min-h-0 min-w-0 flex-col overflow-hidden border">
        <EventDetailSectionHeader title={t("events.detail.sections.fields")} />
        <dl className="grid grid-cols-[104px_minmax(0,1fr)] gap-x-3 gap-y-2 p-3 text-xs">
          <EventDetailTerm label={t("events.detail.terms.title")} value={normalized.title} />
          <EventDetailTerm label={t("events.detail.terms.message")} value={normalized.message} />
          <EventDetailTerm label={t("events.detail.terms.source")} value={detail.source.name} />
          <EventDetailTerm
            label={t("events.detail.terms.severity")}
            value={t(`common.severity.${normalized.severity}`)}
          />
          <EventDetailTerm
            label={t("events.detail.terms.status")}
            value={t(`common.alertStatus.${normalized.status}`)}
          />
          <EventDetailTerm label={t("events.detail.terms.eventId")} value={detail.event.id} mono />
          <EventDetailTerm
            label={t("events.detail.terms.fingerprint")}
            value={normalized.fingerprint}
            mono
          />
          <EventDetailTerm
            label={t("events.detail.terms.idempotencyKey")}
            value={detail.event.idempotencyKey ?? "-"}
            mono
          />
          <EventDetailTerm
            label={t("events.detail.terms.occurred")}
            value={<OperationTimestamp format="dateTime" value={normalized.occurredAt} />}
          />
          <EventDetailTerm
            label={t("events.detail.terms.received")}
            value={<OperationTimestamp format="dateTime" value={detail.event.receivedAt} />}
          />
        </dl>
        <EventLabelList labels={normalized.labels} />
      </section>

      <EventJsonBlock
        title={t("events.detail.json.normalizedEvent")}
        value={normalized}
        className="min-w-0"
      />
    </div>
  );
}
