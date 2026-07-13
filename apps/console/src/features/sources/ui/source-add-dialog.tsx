import * as React from "react";
import { Add2 } from "reicon-react";
import { toast } from "sonner";

import { ConfigurationDialogContent } from "#/components/common/configuration-dialog-content.tsx";
import { Button } from "#/components/ui/button.tsx";
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "#/components/ui/dialog.tsx";
import { useSourceMutations } from "#/features/sources/api/source.mutations.ts";
import { sourceWebhookPath } from "#/features/sources/model/source-webhook.ts";
import { CreateSourceForm } from "#/features/sources/ui/create-source-form.tsx";
import type { SourceTokenNotice } from "#/features/sources/ui/source-token-notice-panel.tsx";
import { useTranslations } from "#/i18n/use-i18n.ts";

export function SourcesAddDialog({
  disabled = false,
  onCreated,
}: {
  disabled?: boolean;
  onCreated: (notice: SourceTokenNotice) => void;
}) {
  const t = useTranslations();
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const { createSource, invalidateSources } = useSourceMutations();

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!pending) {
          setOpen(nextOpen);
        }
      }}
    >
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || pending}
            title={t("sources.page.addTitle")}
            className="w-fit"
          />
        }
      >
        <Add2 data-icon="inline-start" aria-hidden />
        {t("common.actions.add")}
      </DialogTrigger>

      <ConfigurationDialogContent>
        <DialogHeader className="shrink-0 pr-8">
          <DialogTitle>{t("sources.form.create.title")}</DialogTitle>
          <DialogDescription>{t("sources.form.create.description")}</DialogDescription>
        </DialogHeader>

        <CreateSourceForm
          showHeader={false}
          layout="dialog"
          pending={pending}
          onSubmit={async (data) => {
            setPending(true);
            try {
              const result = await createSource({ data });
              await invalidateSources();
              onCreated({
                sourceName: result.source.name,
                webhookPath: sourceWebhookPath(result.source.id),
                token: result.token,
              });
              setOpen(false);
            } catch (error) {
              toast.error(t("sources.page.operationFailed"), {
                description: error instanceof Error ? error.message : String(error),
              });
              return false;
            } finally {
              setPending(false);
            }
          }}
        />
      </ConfigurationDialogContent>
    </Dialog>
  );
}
