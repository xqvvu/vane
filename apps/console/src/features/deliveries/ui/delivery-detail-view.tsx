import { DeliveryAttemptStateBadge } from "#/features/deliveries/ui/delivery-state-badge.tsx";
import {
  formatDateTime,
  summarizeResponseBody,
} from "#/features/operations/model/operation-format.ts";
import type { DeliveryDetail } from "#/features/operations/model/operation-types.ts";

export function DeliveryDetailView({ detail }: { detail: NonNullable<DeliveryDetail> }) {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <div>
        <h3 className="text-xs font-semibold">Delivery detail</h3>
        <dl className="mt-2 grid grid-cols-[112px_minmax(0,1fr)] gap-x-2 gap-y-1 text-xs">
          <DetailTerm label="Destination" value={detail.destination.name} />
          <DetailTerm label="Kind" value={detail.destination.kind} />
          <DetailTerm label="Route" value={detail.route?.name ?? "Manual"} />
          <DetailTerm label="Source" value={detail.source.name} />
          <DetailTerm label="State" value={detail.job.state} />
          <DetailTerm
            label="Attempts"
            value={`${detail.job.attemptCount}/${detail.job.maxAttempts}`}
          />
          <DetailTerm
            label="Next attempt"
            value={detail.job.nextAttemptAt ? formatDateTime(detail.job.nextAttemptAt) : "—"}
          />
          <DetailTerm label="Last error" value={detail.job.lastError ?? "—"} />
        </dl>
      </div>
      <div className="grid gap-2">
        <JsonBlock title="Destination metadata" value={detail.destinationMetadata} />
        <JsonBlock title="Rendered payload" value={detail.renderedPayload ?? {}} />
        <DeliveryAttemptsTable attempts={detail.attempts} />
      </div>
    </div>
  );
}

function DeliveryAttemptsTable({
  attempts,
}: {
  attempts: NonNullable<DeliveryDetail>["attempts"];
}) {
  return (
    <section>
      <h4 className="text-muted-foreground mb-1 text-xs font-medium">Attempts</h4>
      <div className="border-border bg-card max-h-64 overflow-auto border">
        <table className="w-full table-fixed text-left text-[11px]">
          <thead className="bg-muted/50 text-muted-foreground sticky top-0">
            <tr>
              <th className="w-[10%] px-2 py-1.5 font-medium">#</th>
              <th className="w-[16%] px-2 py-1.5 font-medium">State</th>
              <th className="w-[14%] px-2 py-1.5 font-medium">HTTP</th>
              <th className="w-[19%] px-2 py-1.5 font-medium">Started</th>
              <th className="w-[19%] px-2 py-1.5 font-medium">Finished</th>
              <th className="px-2 py-1.5 font-medium">Error / response</th>
            </tr>
          </thead>
          <tbody>
            {attempts.length === 0 ? (
              <tr>
                <td className="text-muted-foreground px-2 py-2" colSpan={6}>
                  No attempts recorded
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
