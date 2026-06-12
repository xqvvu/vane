import { RiCheckboxCircleLine, RiErrorWarningLine, RiEyeLine } from "@remixicon/react";

import { Alert, AlertDescription, AlertTitle } from "#/components/ui/alert.tsx";
import type {
  DestinationPreviewNotice,
  DestinationTestNotice,
} from "#/features/configuration/model/configuration-types.ts";

export function DestinationTestNoticePanel({ notice }: { notice: DestinationTestNotice }) {
  const title = notice.success
    ? `Test ${notice.destination.name}: accepted`
    : `Test ${notice.destination.name}: failed`;

  return (
    <Alert variant={notice.success ? "default" : "destructive"}>
      {notice.success ? <RiCheckboxCircleLine aria-hidden /> : <RiErrorWarningLine aria-hidden />}
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        {notice.success ? (
          <>
            Sender accepted the test
            {notice.statusCode ? ` with HTTP ${notice.statusCode}` : ""}.
          </>
        ) : (
          (notice.error ?? "Destination sender rejected the test.")
        )}
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
  return (
    <Alert>
      <RiEyeLine aria-hidden />
      <AlertTitle>Preview {notice.destination.name}</AlertTitle>
      <AlertDescription>Rendered payload for a deterministic test event.</AlertDescription>
      <pre className="border-border bg-muted/50 col-start-2 mt-2 max-h-56 overflow-auto border p-2 font-mono text-[11px] leading-5">
        {JSON.stringify(notice.renderedPayload, null, 2)}
      </pre>
    </Alert>
  );
}
