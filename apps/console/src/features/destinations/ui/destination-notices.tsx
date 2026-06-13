import { RiCheckboxCircleLine, RiErrorWarningLine, RiEyeLine } from "@remixicon/react";

import { Alert, AlertDescription, AlertTitle } from "#/components/ui/alert.tsx";
import type {
  DestinationPreviewNotice,
  DestinationTestNotice,
} from "#/features/configuration/model/configuration-types.ts";
import { useTranslations } from "#/i18n/use-i18n.ts";

export function DestinationTestNoticePanel({ notice }: { notice: DestinationTestNotice }) {
  const t = useTranslations();
  const title = notice.success
    ? t("destinations.notice.testAcceptedTitle", { name: notice.destination.name })
    : t("destinations.notice.testFailedTitle", { name: notice.destination.name });

  return (
    <Alert variant={notice.success ? "default" : "destructive"} className="mx-3 mt-4">
      {notice.success ? <RiCheckboxCircleLine aria-hidden /> : <RiErrorWarningLine aria-hidden />}
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        {notice.success
          ? notice.statusCode
            ? t("destinations.notice.testAcceptedWithStatus", { statusCode: notice.statusCode })
            : t("destinations.notice.testAccepted")
          : (notice.error ?? t("destinations.notice.testRejected"))}
        {notice.responseBody ? (
          <pre className="border-border bg-muted/50 text-foreground mt-2 max-h-28 overflow-auto border p-2 font-mono text-[11px] leading-5">
            {notice.responseBody}
          </pre>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}

export function DestinationPreviewNoticePanel({ notice }: { notice: DestinationPreviewNotice }) {
  const t = useTranslations();

  return (
    <Alert className="mx-3 mt-4">
      <RiEyeLine aria-hidden />
      <AlertTitle>
        {t("destinations.notice.previewTitle", { name: notice.destination.name })}
      </AlertTitle>
      <AlertDescription>{t("destinations.notice.previewDescription")}</AlertDescription>
      <pre className="border-border bg-muted/50 col-start-2 mt-2 max-h-56 overflow-auto border p-2 font-mono text-[11px] leading-5">
        {JSON.stringify(notice.renderedPayload, null, 2)}
      </pre>
    </Alert>
  );
}
