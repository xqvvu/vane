import { DeliveryStateBadge } from "#/features/deliveries/ui/delivery-state-badge.tsx";
import { formatDateTime, formatTime } from "#/features/operations/model/operation-format.ts";
import type { EventDetail } from "#/features/operations/model/operation-types.ts";
import { cn } from "#/lib/utils.ts";

export function EventDetailView({ detail }: { detail: NonNullable<EventDetail> }) {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <div className="grid gap-3">
        <div>
          <h3 className="text-xs font-semibold">Event detail</h3>
          <dl className="mt-2 grid grid-cols-[96px_minmax(0,1fr)] gap-x-2 gap-y-1 text-xs">
            <DetailTerm label="Source" value={detail.source.name} />
            <DetailTerm label="Title" value={detail.event.normalized.title} />
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
        </div>
        <EventDeliveriesTable deliveries={detail.deliveries} />
      </div>
      <div className="grid gap-2">
        <JsonBlock title="Normalized" value={detail.event.normalized} />
        <RouteMatchesTable matches={detail.routeMatches} />
        <JsonBlock title="Raw payload" value={detail.event.rawPayload} />
        <JsonBlock title="Raw headers" value={detail.event.rawHeaders} />
      </div>
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
    <span
      className={cn(
        "inline-flex items-center border px-1.5 py-0.5 text-[11px] font-medium",
        matched
          ? "border-emerald-600/30 bg-emerald-50 text-emerald-700"
          : "border-red-600/30 bg-red-50 text-red-700",
      )}
    >
      {matched ? "Matched" : "Missed"}
    </span>
  );
}

function RouteCheckBadge({
  check,
}: {
  check: NonNullable<EventDetail>["routeMatches"][number]["checks"][number];
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1 border px-1.5 py-0.5",
        check.matched
          ? "border-emerald-600/20 bg-emerald-50 text-emerald-800"
          : "border-red-600/20 bg-red-50 text-red-800",
      )}
      title={check.detail}
    >
      <span className="font-medium">{check.field}</span>
      <span className="text-muted-foreground truncate">{check.detail}</span>
    </span>
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
