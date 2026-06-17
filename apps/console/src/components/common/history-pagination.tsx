import { RiArrowRightLine, RiRefreshLine } from "@remixicon/react";

import { Button } from "#/components/ui/button.tsx";

export interface HistoryPaginationProps {
  latestLabel: string;
  olderLabel: string;
  showLatestLabel: string;
  showOlderLabel: string;
  pending: boolean;
  hasOlder: boolean;
  onOlder?: () => void;
  onLatest: () => void;
}

export function HistoryPagination({
  latestLabel,
  olderLabel,
  showLatestLabel,
  showOlderLabel,
  pending,
  hasOlder,
  onOlder,
  onLatest,
}: HistoryPaginationProps) {
  return (
    <div className="border-border bg-background flex shrink-0 items-center justify-end gap-1 border-x border-b px-3 py-3">
      <Button
        type="button"
        variant="outline"
        size="xs"
        disabled={pending}
        onClick={onLatest}
        title={showLatestLabel}
      >
        <RiRefreshLine data-icon="inline-start" aria-hidden />
        {latestLabel}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="xs"
        disabled={pending || !hasOlder || !onOlder}
        onClick={onOlder}
        title={showOlderLabel}
      >
        {olderLabel}
        <RiArrowRightLine data-icon="inline-end" aria-hidden />
      </Button>
    </div>
  );
}
