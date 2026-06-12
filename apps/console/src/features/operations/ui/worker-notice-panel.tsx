import { RiInformationLine } from "@remixicon/react";

import { Alert, AlertDescription, AlertTitle } from "#/components/ui/alert.tsx";
import type { WorkerRunNotice } from "#/features/operations/model/operation-types.ts";

export function WorkerNoticePanel({ notice }: { notice: WorkerRunNotice }) {
  return (
    <Alert className="mx-3 mt-4">
      <RiInformationLine aria-hidden />
      <AlertTitle>Worker run complete</AlertTitle>
      <AlertDescription>
        {notice.claimed} claimed, {notice.succeeded} succeeded, {notice.failed} failed,{" "}
        {notice.retrying} retrying.
      </AlertDescription>
    </Alert>
  );
}
