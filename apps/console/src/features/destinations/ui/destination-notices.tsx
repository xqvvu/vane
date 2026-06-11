import type {
  DestinationPreviewNotice,
  DestinationTestNotice,
} from "#/features/configuration/model/configuration-types.ts";
import { cn } from "#/lib/utils.ts";

export function DestinationTestNoticePanel({ notice }: { notice: DestinationTestNotice }) {
  return (
    <div
      className={cn(
        "border px-3 py-2 text-xs",
        notice.success
          ? "border-emerald-600/30 bg-emerald-50 text-emerald-800"
          : "border-red-600/30 bg-red-50 text-red-800",
      )}
    >
      Test {notice.destination.name}:{" "}
      {notice.success
        ? `accepted${notice.statusCode ? ` (${notice.statusCode})` : ""}`
        : (notice.error ?? "failed")}
    </div>
  );
}

export function DestinationPreviewNoticePanel({ notice }: { notice: DestinationPreviewNotice }) {
  return (
    <div className="border-border bg-card border px-3 py-2 text-xs">
      <div className="font-semibold">Preview {notice.destination.name}</div>
      <pre className="mt-2 max-h-56 overflow-auto font-mono text-[11px] leading-5">
        {JSON.stringify(notice.renderedPayload, null, 2)}
      </pre>
    </div>
  );
}
