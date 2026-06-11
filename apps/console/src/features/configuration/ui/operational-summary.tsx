import type { Configuration } from "#/features/configuration/model/configuration-types.ts";

export function OperationalSummary({ configuration }: { configuration: Configuration }) {
  const enabledSources = configuration.sources.filter((source) => source.enabled).length;
  const enabledDestinations = configuration.destinations.filter(
    (destination) => destination.enabled,
  ).length;
  const enabledRoutes = configuration.routes.filter((route) => route.enabled).length;

  return (
    <div className="grid gap-3 md:grid-cols-3">
      <Metric label="Enabled sources" value={enabledSources} total={configuration.sources.length} />
      <Metric
        label="Enabled destinations"
        value={enabledDestinations}
        total={configuration.destinations.length}
      />
      <Metric label="Enabled routes" value={enabledRoutes} total={configuration.routes.length} />
    </div>
  );
}

function Metric({ label, value, total }: { label: string; value: number; total: number }) {
  return (
    <div className="border-border bg-card border px-3 py-3">
      <div className="text-muted-foreground text-xs">{label}</div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-2xl font-semibold">{value}</span>
        <span className="text-muted-foreground text-xs">/ {total}</span>
      </div>
    </div>
  );
}
