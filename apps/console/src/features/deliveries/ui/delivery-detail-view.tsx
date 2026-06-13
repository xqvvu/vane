import { Badge } from "#/components/ui/badge.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs.tsx";
import { DeliveryAttemptStateBadge } from "#/features/deliveries/ui/delivery-state-badge.tsx";
import {
  formatDateTime,
  summarizeResponseBody,
} from "#/features/operations/model/operation-format.ts";
import type { DeliveryDetail } from "#/features/operations/model/operation-types.ts";
import { useTranslations } from "#/i18n/use-i18n.ts";

export function DeliveryDetailView({ detail }: { detail: NonNullable<DeliveryDetail> }) {
  const t = useTranslations();

  return (
    <div className="grid gap-3">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="truncate text-xs font-semibold">{detail.destination.name}</h3>
          <p className="text-muted-foreground mt-1 truncate text-xs">
            {detail.source.name} / {detail.route?.name ?? t("deliveries.detail.manual")} /{" "}
            {detail.event.normalized.title}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Badge variant={detail.job.state === "failed" ? "destructive" : "secondary"}>
            {t(`common.deliveryState.${detail.job.state}`)}
          </Badge>
          <Badge variant="outline">
            {t("deliveries.detail.attemptCount", {
              attemptCount: detail.job.attemptCount,
              maxAttempts: detail.job.maxAttempts,
            })}
          </Badge>
        </div>
      </div>
      <Tabs defaultValue="summary">
        <TabsList variant="line" className="w-full justify-start">
          <TabsTrigger value="summary">{t("deliveries.detail.tabs.summary")}</TabsTrigger>
          <TabsTrigger value="payload">{t("deliveries.detail.tabs.payload")}</TabsTrigger>
          <TabsTrigger value="attempts">{t("deliveries.detail.tabs.attempts")}</TabsTrigger>
          <TabsTrigger value="metadata">{t("deliveries.detail.tabs.metadata")}</TabsTrigger>
        </TabsList>
        <TabsContent value="summary" className="pt-2">
          <dl className="grid grid-cols-[112px_minmax(0,1fr)] gap-x-2 gap-y-1 text-xs lg:max-w-2xl">
            <DetailTerm
              label={t("deliveries.detail.terms.destination")}
              value={detail.destination.name}
            />
            <DetailTerm
              label={t("deliveries.detail.terms.kind")}
              value={t(`destinations.kinds.${detail.destination.kind}`)}
            />
            <DetailTerm
              label={t("deliveries.detail.terms.route")}
              value={detail.route?.name ?? t("deliveries.detail.manual")}
            />
            <DetailTerm label={t("deliveries.detail.terms.source")} value={detail.source.name} />
            <DetailTerm
              label={t("deliveries.detail.terms.event")}
              value={detail.event.normalized.title}
            />
            <DetailTerm
              label={t("deliveries.detail.terms.state")}
              value={t(`common.deliveryState.${detail.job.state}`)}
            />
            <DetailTerm
              label={t("deliveries.detail.terms.attempts")}
              value={`${detail.job.attemptCount}/${detail.job.maxAttempts}`}
            />
            <DetailTerm
              label={t("deliveries.detail.terms.nextAttempt")}
              value={detail.job.nextAttemptAt ? formatDateTime(detail.job.nextAttemptAt) : "—"}
            />
            <DetailTerm
              label={t("deliveries.detail.terms.lastError")}
              value={detail.job.lastError ?? "—"}
            />
          </dl>
        </TabsContent>
        <TabsContent value="payload" className="pt-2">
          <JsonBlock
            title={t("deliveries.detail.json.renderedPayload")}
            value={detail.renderedPayload ?? {}}
          />
        </TabsContent>
        <TabsContent value="attempts" className="pt-2">
          <DeliveryAttemptsTable attempts={detail.attempts} />
        </TabsContent>
        <TabsContent value="metadata" className="pt-2">
          <JsonBlock
            title={t("deliveries.detail.json.destinationMetadata")}
            value={detail.destinationMetadata}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DeliveryAttemptsTable({
  attempts,
}: {
  attempts: NonNullable<DeliveryDetail>["attempts"];
}) {
  const t = useTranslations();

  return (
    <section>
      <h4 className="text-muted-foreground mb-1 text-xs font-medium">
        {t("deliveries.detail.attemptsTitle")}
      </h4>
      <div className="border-border bg-card max-h-64 overflow-auto border">
        <table className="w-full table-fixed text-left text-[11px]">
          <thead className="bg-muted/50 text-muted-foreground sticky top-0">
            <tr>
              <th className="w-[10%] px-2 py-1.5 font-medium">
                {t("deliveries.detail.attemptHeaders.number")}
              </th>
              <th className="w-[16%] px-2 py-1.5 font-medium">
                {t("deliveries.detail.attemptHeaders.state")}
              </th>
              <th className="w-[14%] px-2 py-1.5 font-medium">
                {t("deliveries.detail.attemptHeaders.http")}
              </th>
              <th className="w-[19%] px-2 py-1.5 font-medium">
                {t("deliveries.detail.attemptHeaders.started")}
              </th>
              <th className="w-[19%] px-2 py-1.5 font-medium">
                {t("deliveries.detail.attemptHeaders.finished")}
              </th>
              <th className="px-2 py-1.5 font-medium">
                {t("deliveries.detail.attemptHeaders.errorResponse")}
              </th>
            </tr>
          </thead>
          <tbody>
            {attempts.length === 0 ? (
              <tr>
                <td className="text-muted-foreground px-2 py-2" colSpan={6}>
                  {t("deliveries.detail.empty.attempts")}
                </td>
              </tr>
            ) : (
              attempts.map((attempt) => {
                const note = attempt.error ?? summarizeResponseBody(attempt.responseBody);

                return (
                  <tr key={attempt.id} className="border-border/70 border-t align-top">
                    <td className="px-2 py-2 font-medium">{attempt.attemptNumber}</td>
                    <td className="px-2 py-2">
                      <DeliveryAttemptStateBadge state={attempt.state} />
                    </td>
                    <td className="px-2 py-2">{attempt.responseStatus ?? "—"}</td>
                    <td className="truncate px-2 py-2" title={formatDateTime(attempt.startedAt)}>
                      {formatDateTime(attempt.startedAt)}
                    </td>
                    <td
                      className="truncate px-2 py-2"
                      title={attempt.finishedAt ? formatDateTime(attempt.finishedAt) : undefined}
                    >
                      {attempt.finishedAt ? formatDateTime(attempt.finishedAt) : "—"}
                    </td>
                    <td className="truncate px-2 py-2" title={note === "—" ? undefined : note}>
                      {note}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function DetailTerm({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="truncate font-medium">{value}</dd>
    </>
  );
}

function JsonBlock({ title, value }: { title: string; value: unknown }) {
  return (
    <div>
      <h4 className="text-muted-foreground mb-1 text-xs font-medium">{title}</h4>
      <pre className="border-border bg-card max-h-64 overflow-auto border p-2 text-[11px] leading-5">
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}
