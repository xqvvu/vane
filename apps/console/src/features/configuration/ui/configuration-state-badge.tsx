import { Badge } from "#/components/ui/badge.tsx";
import { useTranslations } from "#/i18n/use-i18n.ts";
import { cn } from "#/lib/utils.ts";

export function ConfigurationStateBadge({ enabled }: { enabled: boolean }) {
  const t = useTranslations();

  return (
    <Badge
      variant="outline"
      className={cn(
        "min-w-18 justify-start gap-1.5 font-mono text-[11px]",
        enabled
          ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          : "border-border bg-muted/40 text-muted-foreground",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "size-1.5 shrink-0 rounded-full",
          enabled
            ? "bg-emerald-500 shadow-[0_0_8px_rgb(16_185_129_/_0.75)]"
            : "bg-muted-foreground/45",
        )}
      />
      {enabled ? t("configuration.stateBadge.enabled") : t("configuration.stateBadge.disabled")}
    </Badge>
  );
}
