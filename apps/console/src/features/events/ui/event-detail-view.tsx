import { Badge } from "#/components/ui/badge.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs.tsx";
import { DeliveryStateBadge } from "#/features/deliveries/ui/delivery-state-badge.tsx";
import { formatDateTime, formatTime } from "#/features/operations/model/operation-format.ts";
import type { EventDetail } from "#/features/operations/model/operation-types.ts";
import { useTranslations } from "#/i18n/use-i18n.ts";

export function EventDetailView({ detail }: { detail: NonNullable<EventDetail> }) {
  const t = useTranslations();

  return (
    <div className="grid gap-3">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="truncate text-xs font-semibold">{detail.event.normalized.title}</h3>
          <p className="text-muted-foreground mt-1 truncate text-xs">
            {detail.source.name} / {detail.event.normalized.fingerprint}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Badge
            variant={detail.event.normalized.status === "firing" ? "destructive" : "secondary"}
          >
            {t(`common.alertStatus.${detail.event.normalized.status}`)}
          </Badge>
          <Badge variant="outline">
            {t("events.detail.match.matched", {
              count: detail.routeMatches.filter((match) => match.matched).length,
            })}
          </Badge>
          <Badge variant="outline">
            {t("events.detail.deliveries", { count: detail.deliveries.length })}
          </Badge>
        </div>
      </div>
      <Tabs defaultValue="normalized">
        <TabsList variant="line" className="w-full justify-start">
          <TabsTrigger value="normalized">{t("events.detail.tabs.normalized")}</TabsTrigger>
          <TabsTrigger value="matches">{t("events.detail.tabs.matches")}</TabsTrigger>
          <TabsTrigger value="deliveries">{t("events.detail.tabs.deliveries")}</TabsTrigger>
          <TabsTrigger value="raw">{t("events.detail.tabs.raw")}</TabsTrigger>
        </TabsList>
        <TabsContent value="normalized" className="pt-2">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
            <dl className="grid grid-cols-[96px_minmax(0,1fr)] gap-x-2 gap-y-1 text-xs">
              <DetailTerm label={t("events.detail.terms.source")} value={detail.source.name} />
              <DetailTerm
                label={t("events.detail.terms.severity")}
                value={t(`common.severity.${detail.event.normalized.severity}`)}
              />
              <DetailTerm
                label={t("events.detail.terms.status")}
                value={t(`common.alertStatus.${detail.event.normalized.status}`)}
              />
              <DetailTerm
                label={t("events.detail.terms.fingerprint")}
                value={detail.event.normalized.fingerprint}
              />
              <DetailTerm
                label={t("events.detail.terms.occurred")}
                value={formatDateTime(detail.event.normalized.occurredAt)}
              />
              <DetailTerm
                label={t("events.detail.terms.received")}
                value={formatDateTime(detail.event.receivedAt)}
              />
              <DetailTerm
                label={t("events.detail.terms.deliveries")}
                value={String(detail.deliveries.length)}
              />
            </dl>
            <JsonBlock
              title={t("events.detail.json.normalizedEvent")}
              value={detail.event.normalized}
            />
          </div>
        </TabsContent>
        <TabsContent value="matches" className="pt-2">
          <RouteMatchesTable matches={detail.routeMatches} />
        </TabsContent>
        <TabsContent value="deliveries" className="pt-2">
          <EventDeliveriesTable deliveries={detail.deliveries} />
        </TabsContent>
        <TabsContent value="raw" className="pt-2">
          <div className="grid gap-2 lg:grid-cols-2">
            <div className="lg:col-span-2">
              <p className="text-muted-foreground text-xs">{t("events.detail.rawNotice")}</p>
            </div>
            <JsonBlock title={t("events.detail.json.rawPayload")} value={detail.event.rawPayload} />
            <JsonBlock title={t("events.detail.json.rawHeaders")} value={detail.event.rawHeaders} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EventDeliveriesTable({
  deliveries,
}: {
  deliveries: NonNullable<EventDetail>["deliveries"];
}) {
  const t = useTranslations();

  return (
    <section>
      <h4 className="text-muted-foreground mb-1 text-xs font-medium">
        {t("events.detail.eventDeliveriesTitle")}
      </h4>
      <div className="border-border bg-card max-h-64 overflow-auto border">
        <table className="w-full table-fixed text-left text-[11px]">
          <thead className="bg-muted/50 text-muted-foreground sticky top-0">
            <tr>
              <th className="w-[23%] px-2 py-1.5 font-medium">
                {t("events.detail.deliveryHeaders.destination")}
              </th>
              <th className="w-[20%] px-2 py-1.5 font-medium">
                {t("events.detail.deliveryHeaders.route")}
              </th>
              <th className="w-[16%] px-2 py-1.5 font-medium">
                {t("events.detail.deliveryHeaders.state")}
              </th>
              <th className="w-[13%] px-2 py-1.5 font-medium">
                {t("events.detail.deliveryHeaders.attempts")}
              </th>
              <th className="w-[18%] px-2 py-1.5 font-medium">
                {t("events.detail.deliveryHeaders.next")}
              </th>
              <th className="px-2 py-1.5 font-medium">
                {t("events.detail.deliveryHeaders.lastError")}
              </th>
            </tr>
          </thead>
          <tbody>
            {deliveries.length === 0 ? (
              <tr>
                <td className="text-muted-foreground px-2 py-2" colSpan={6}>
                  {t("events.detail.empty.deliveries")}
                </td>
              </tr>
            ) : (
              deliveries.map((delivery) => (
                <tr key={delivery.id} className="border-border/70 border-t align-top">
                  <td className="truncate px-2 py-2 font-medium">{delivery.destinationName}</td>
                  <td className="truncate px-2 py-2">
                    {delivery.routeName ?? t("events.detail.manual")}
                  </td>
                  <td className="px-2 py-2">
                    <DeliveryStateBadge state={delivery.state} />
                  </td>
                  <td className="px-2 py-2">
                    {delivery.attemptCount}/{delivery.maxAttempts}
                  </td>
                  <td className="truncate px-2 py-2">
                    {delivery.nextAttemptAt ? formatTime(delivery.nextAttemptAt) : "—"}
                  </td>
                  <td className="truncate px-2 py-2" title={delivery.lastError ?? undefined}>
                    {delivery.lastError ?? "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function RouteMatchesTable({ matches }: { matches: NonNullable<EventDetail>["routeMatches"] }) {
  const t = useTranslations();

  return (
    <section>
      <h4 className="text-muted-foreground mb-1 text-xs font-medium">
        {t("events.detail.routeMatchesTitle")}
      </h4>
      <div className="border-border bg-card max-h-64 overflow-auto border">
        <table className="w-full table-fixed text-left text-[11px]">
          <thead className="bg-muted/50 text-muted-foreground sticky top-0">
            <tr>
              <th className="w-[30%] px-2 py-1.5 font-medium">
                {t("events.detail.routeHeaders.route")}
              </th>
              <th className="w-[18%] px-2 py-1.5 font-medium">
                {t("events.detail.routeHeaders.result")}
              </th>
              <th className="w-[16%] px-2 py-1.5 font-medium">
                {t("events.detail.routeHeaders.targets")}
              </th>
              <th className="px-2 py-1.5 font-medium">{t("events.detail.routeHeaders.checks")}</th>
            </tr>
          </thead>
          <tbody>
            {matches.length === 0 ? (
              <tr>
                <td className="text-muted-foreground px-2 py-2" colSpan={4}>
                  {t("events.detail.empty.routes")}
                </td>
              </tr>
            ) : (
              matches.map((match) => (
                <tr key={match.routeId} className="border-border/70 border-t align-top">
                  <td className="truncate px-2 py-2 font-medium">{match.routeName}</td>
                  <td className="px-2 py-2">
                    <MatchBadge matched={match.matched} />
                  </td>
                  <td className="px-2 py-2">{match.destinationIds.length}</td>
                  <td className="px-2 py-2">
                    <div className="flex flex-wrap gap-1">
                      {match.checks.map((check) => (
                        <RouteCheckBadge
                          key={`${match.routeId}-${check.field}-${check.detail}`}
                          check={check}
                        />
                      ))}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function MatchBadge({ matched }: { matched: boolean }) {
  const t = useTranslations();

  return (
    <Badge variant={matched ? "secondary" : "destructive"}>
      {matched ? t("events.detail.match.matched") : t("events.detail.match.missed")}
    </Badge>
  );
}

function RouteCheckBadge({
  check,
}: {
  check: NonNullable<EventDetail>["routeMatches"][number]["checks"][number];
}) {
  return (
    <Badge variant={check.matched ? "outline" : "destructive"} title={check.detail}>
      <span className="font-medium">{check.field}</span>
      <span className="text-muted-foreground truncate">{check.detail}</span>
    </Badge>
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
