import { StatusBadge } from "#/components/common/status-badge.tsx";
import { useTranslations } from "#/i18n/use-i18n.ts";

export function EnabledStateBadge({ enabled }: { enabled: boolean }) {
  const t = useTranslations();

  return (
    <StatusBadge tone={enabled ? "success" : "neutral"} pulse={enabled}>
      {enabled ? t("common.state.enabled") : t("common.state.disabled")}
    </StatusBadge>
  );
}
