import { cn } from "#/lib/utils.ts";

export function ConfigurationStateBadge({ enabled }: { enabled: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center border px-1.5 py-0.5 text-[11px] font-medium",
        enabled
          ? "border-emerald-600/30 bg-emerald-50 text-emerald-700"
          : "border-slate-300 bg-slate-100 text-slate-600",
      )}
    >
      {enabled ? "Enabled" : "Disabled"}
    </span>
  );
}
