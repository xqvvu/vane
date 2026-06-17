import { RiInformationLine } from "@remixicon/react";

import { Alert, AlertDescription, AlertTitle } from "#/components/ui/alert.tsx";
import type { WorkerRunNotice } from "#/features/operations/model/operation-types.ts";
import { useTranslations } from "#/i18n/use-i18n.ts";

export function WorkerNoticePanel({ notice }: { notice: WorkerRunNotice }) {
  const t = useTranslations();

  return (
    <Alert className="mx-3 mt-4">
      <RiInformationLine aria-hidden />
      <AlertTitle>{t("operations.workerNotice.title")}</AlertTitle>
      <AlertDescription>
        {t("operations.workerNotice.description", {
          claimed: notice.claimed,
          reclaimed: notice.reclaimed,
          succeeded: notice.succeeded,
          failed: notice.failed,
          retrying: notice.retrying,
        })}
        {notice.health ? (
          <span className="text-muted-foreground mt-1 block text-xs">
            {t("operations.workerNotice.health", {
              state: notice.health.state,
              lastFinishedAt: notice.health.lastFinishedAt ?? t("common.placeholder.empty"),
            })}
          </span>
        ) : null}
        {notice.runnerHealth?.lastError ? (
          <span className="text-destructive mt-1 block text-xs">
            {t("operations.workerNotice.lastError", {
              error: notice.runnerHealth.lastError,
            })}
          </span>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}
