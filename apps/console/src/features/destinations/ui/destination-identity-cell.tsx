import type { DestinationSummary } from "#/features/destinations/ui/destination-ui-types.ts";

export function DestinationIdentityCell({ destination }: { destination: DestinationSummary }) {
  return (
    <div className="min-w-0">
      <div className="truncate text-xs font-medium" title={destination.name}>
        {destination.name}
      </div>
      <div
        className="text-muted-foreground mt-0.5 truncate font-mono text-[11px]"
        title={destination.id}
      >
        {destination.id}
      </div>
    </div>
  );
}
