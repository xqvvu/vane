import type { WorkerRunNotice } from "#/features/operations/model/operation-types.ts";

export function WorkerNoticePanel({ notice }: { notice: WorkerRunNotice }) {
  return (
    <div className="border-border bg-card border px-3 py-2 text-xs">
      Worker run: claimed {notice.claimed}, succeeded {notice.succeeded}, retrying {notice.retrying}
      , failed {notice.failed}
    </div>
  );
}
