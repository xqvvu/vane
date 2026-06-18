import * as React from "react";
import { toast } from "sonner";

import {
  CodeBlock,
  CodeBlockActions,
  CodeBlockCopyButton,
  CodeBlockFilename,
  CodeBlockHeader,
  CodeBlockTitle,
} from "#/components/ai-elements/code-block.tsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog.tsx";
import type {
  DestinationPreviewNotice,
  DestinationTestNotice,
} from "#/features/configuration/model/configuration-types.ts";
import { useTranslations } from "#/i18n/use-i18n.ts";

type TranslationFn = ReturnType<typeof useTranslations>;

export function showDestinationTestToast(notice: DestinationTestNotice, t: TranslationFn) {
  const title = notice.success
    ? t("destinations.notice.testAcceptedTitle", { name: notice.destination.name })
    : t("destinations.notice.testFailedTitle", { name: notice.destination.name });
  const message = notice.success
    ? notice.statusCode
      ? t("destinations.notice.testAcceptedWithStatus", { statusCode: notice.statusCode })
      : t("destinations.notice.testAccepted")
    : (notice.error ?? t("destinations.notice.testRejected"));
  const description = (
    <div className="flex max-w-[min(28rem,calc(100vw-3rem))] flex-col gap-2">
      <span>{message}</span>
      {notice.responseBody ? (
        <pre className="bg-muted text-muted-foreground max-h-28 overflow-auto p-2 font-mono text-[11px] whitespace-pre-wrap">
          {notice.responseBody}
        </pre>
      ) : null}
    </div>
  );

  if (notice.success) {
    toast.success(title, { description });
    return;
  }

  toast.error(title, { description });
}

export function DestinationPreviewDialog({
  notice,
  open,
  onOpenChange,
}: {
  notice: DestinationPreviewNotice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations();
  const renderedPayload = React.useMemo(
    () => (notice ? JSON.stringify(notice.renderedPayload, null, 2) : ""),
    [notice],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(760px,calc(100dvh-2rem))] overflow-hidden sm:max-w-4xl">
        <DialogHeader className="pr-8">
          <DialogTitle>
            {notice ? t("destinations.notice.previewTitle", { name: notice.destination.name }) : ""}
          </DialogTitle>
          <DialogDescription>{t("destinations.notice.previewDescription")}</DialogDescription>
        </DialogHeader>
        {notice ? (
          <CodeBlock
            code={renderedPayload}
            language="json"
            showLineNumbers
            contentClassName="max-h-[min(520px,calc(100dvh-14rem))]"
          >
            <CodeBlockHeader>
              <CodeBlockTitle>
                <CodeBlockFilename>
                  {t("destinations.notice.previewPayloadFilename")}
                </CodeBlockFilename>
              </CodeBlockTitle>
              <CodeBlockActions>
                <CodeBlockCopyButton
                  aria-label={t("destinations.notice.copyPreviewPayload")}
                  title={t("destinations.notice.copyPreviewPayload")}
                  onCopy={() => toast.success(t("common.actions.copied"))}
                  onError={() => toast.error(t("common.actions.copyFailed"))}
                />
              </CodeBlockActions>
            </CodeBlockHeader>
          </CodeBlock>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
