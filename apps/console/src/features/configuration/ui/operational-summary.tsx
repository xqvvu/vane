import type { Configuration } from "#/features/configuration/model/configuration-types.ts";
import { useTranslations } from "#/i18n/use-i18n.ts";
import { cn } from "#/lib/utils.ts";

export function OperationalSummary({
  configuration,
  layout = "grid",
  retentionDays,
}: {
  configuration: Configuration;
  layout?: "grid" | "rail";
  retentionDays?: number;
}) {
  const t = useTranslations();
  const enabledSources = configuration.sources.filter((source) => source.enabled).length;
  const enabledDestinations = configuration.destinations.filter(
    (destination) => destination.enabled,
  ).length;
  const enabledRoutes = configuration.routes.filter((route) => route.enabled).length;
  const gridClassName =
    layout === "rail"
      ? "grid-cols-1"
      : retentionDays === undefined
        ? "md:grid-cols-3"
        : "md:grid-cols-4";

  return (
    <div className={cn("grid gap-3", gridClassName)}>
      <Metric
        label={t("configuration.summary.enabledSources")}
        value={enabledSources}
        total={configuration.sources.length}
      />
      <Metric
        label={t("configuration.summary.enabledDestinations")}
        value={enabledDestinations}
        total={configuration.destinations.length}
      />
      <Metric
        label={t("configuration.summary.enabledRoutes")}
        value={enabledRoutes}
        total={configuration.routes.length}
      />
      {retentionDays === undefined ? null : (
        <Metric
          label={t("configuration.summary.rawPayloadRetention")}
          value={retentionDays}
          suffix={t("configuration.summary.days")}
        />
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  total,
  suffix,
}: {
  label: string;
  value: number;
  total?: number;
  suffix?: string;
}) {
  return (
    <div className="border-border bg-card border px-3 py-3">
      <div className="text-muted-foreground text-xs">{label}</div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-2xl font-semibold">{value}</span>
        {total === undefined ? null : (
          <span className="text-muted-foreground text-xs">/ {total}</span>
        )}
        {suffix ? <span className="text-muted-foreground text-xs">{suffix}</span> : null}
      </div>
    </div>
  );
}
