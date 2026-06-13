import { Badge } from "#/components/ui/badge.tsx";
import { useTranslations } from "#/i18n/use-i18n.ts";

export function ConfigurationStateBadge({ enabled }: { enabled: boolean }) {
  const t = useTranslations();

  return (
    <Badge variant={enabled ? "secondary" : "outline"} className="font-mono text-[11px]">
      {enabled ? t("configuration.stateBadge.enabled") : t("configuration.stateBadge.disabled")}
    </Badge>
  );
}
