export function DeliveryEventCell({
  eventId,
  sourceName,
}: {
  eventId: string;
  sourceName: string;
}) {
  return (
    <div className="min-w-0">
      <div className="truncate font-medium" title={sourceName}>
        {sourceName}
      </div>
      <div className="text-muted-foreground truncate font-mono text-[11px]" title={eventId}>
        {eventId}
      </div>
    </div>
  );
}
