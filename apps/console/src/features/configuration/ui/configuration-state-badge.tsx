import { Badge } from "#/components/ui/badge.tsx";

export function ConfigurationStateBadge({ enabled }: { enabled: boolean }) {
  return (
    <Badge variant={enabled ? "secondary" : "outline"} className="font-mono text-[11px]">
      {enabled ? "Enabled" : "Disabled"}
    </Badge>
  );
}
