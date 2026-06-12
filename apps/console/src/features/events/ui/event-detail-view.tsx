import { Badge } from "#/components/ui/badge.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs.tsx";
import { DeliveryStateBadge } from "#/features/deliveries/ui/delivery-state-badge.tsx";
import { formatDateTime, formatTime } from "#/features/operations/model/operation-format.ts";
import type { EventDetail } from "#/features/operations/model/operation-types.ts";

export function EventDetailView({ detail }: { detail: NonNullable<EventDetail> }) {
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
            {detail.event.normalized.status}
          </Badge>
          <Badge variant="outline">
            {detail.routeMatches.filter((match) => match.matched).length} matched
          </Badge>
          <Badge variant="outline">{detail.deliveries.length} deliveries</Badge>
        </div>
      </div>
      <Tabs defaultValue="normalized">
        <TabsList variant="line" className="w-full justify-start">
          <TabsTrigger value="normalized">Normalized fields</TabsTrigger>
          <TabsTrigger value="matches">Route matches</TabsTrigger>
          <TabsTrigger value="deliveries">Deliveries</TabsTrigger>
          <TabsTrigger value="raw">Raw debug</TabsTrigger>
        </TabsList>
        <TabsContent value="normalized" className="pt-2">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
            <dl className="grid grid-cols-[96px_minmax(0,1fr)] gap-x-2 gap-y-1 text-xs">
              <DetailTerm label="Source" value={detail.source.name} />
              <DetailTerm label="Severity" value={detail.event.normalized.severity} />
              <DetailTerm label="Status" value={detail.event.normalized.status} />
              <DetailTerm label="Fingerprint" value={detail.event.normalized.fingerprint} />
              <DetailTerm
                label="Occurred"
                value={formatDateTime(detail.event.normalized.occurredAt)}
              />
              <DetailTerm label="Received" value={formatDateTime(detail.event.receivedAt)} />
              <DetailTerm label="Deliveries" value={String(detail.deliveries.length)} />
            </dl>
            <JsonBlock title="Normalized event" value={detail.event.normalized} />
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
              <p className="text-muted-foreground text-xs">
                Raw provider data is displayed only after server-side redaction.
              </p>
            </div>
            <JsonBlock title="Raw payload" value={detail.event.rawPayload} />
            <JsonBlock title="Raw headers" value={detail.event.rawHeaders} />
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
  return (
    <section>
      <h4 className="text-muted-foreground mb-1 text-xs font-medium">Event deliveries</h4>
      <div className="border-border bg-card max-h-64 overflow-auto border">
        <table className="w-full table-fixed text-left text-[11px]">
          <thead className="bg-muted/50 text-muted-foreground sticky top-0">
            <tr>
              <th className="w-[23%] px-2 py-1.5 font-medium">Destination</th>
              <th className="w-[20%] px-2 py-1.5 font-medium">Route</th>
              <th className="w-[16%] px-2 py-1.5 font-medium">State</th>
              <th className="w-[13%] px-2 py-1.5 font-medium">Attempts</th>
              <th className="w-[18%] px-2 py-1.5 font-medium">Next</th>
              <th className="px-2 py-1.5 font-medium">Last error</th>
            </tr>
          </thead>
          <tbody>
            {deliveries.length === 0 ? (
              <tr>
                <td className="text-muted-foreground px-2 py-2" colSpan={6}>
                  No deliveries created
                </td>
              </tr>
            ) : (
              deliveries.map((delivery) => (
                <tr key={delivery.id} className="border-border/70 border-t align-top">
                  <td className="truncate px-2 py-2 font-medium">{delivery.destinationName}</td>
                  <td className="truncate px-2 py-2">{delivery.routeName ?? "Manual"}</td>
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
  return (
    <section>
      <h4 className="text-muted-foreground mb-1 text-xs font-medium">Route matches</h4>
      <div className="border-border bg-card max-h-64 overflow-auto border">
        <table className="w-full table-fixed text-left text-[11px]">
          <thead className="bg-muted/50 text-muted-foreground sticky top-0">
            <tr>
              <th className="w-[30%] px-2 py-1.5 font-medium">Route</th>
              <th className="w-[18%] px-2 py-1.5 font-medium">Result</th>
              <th className="w-[16%] px-2 py-1.5 font-medium">Targets</th>
              <th className="px-2 py-1.5 font-medium">Checks</th>
            </tr>
          </thead>
          <tbody>
            {matches.length === 0 ? (
              <tr>
                <td className="text-muted-foreground px-2 py-2" colSpan={4}>
                  No routes evaluated
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
  return (
    <Badge variant={matched ? "secondary" : "destructive"}>{matched ? "Matched" : "Missed"}</Badge>
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
