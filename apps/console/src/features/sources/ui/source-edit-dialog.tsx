import * as React from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog";
import { useSourceMutations } from "#/features/sources/api/source.mutations";
import { EditSourceForm } from "#/features/sources/ui/edit-source-form";
import type { SourceSummary } from "#/features/sources/ui/source-ui-types";
import { useTranslations } from "#/i18n/use-i18n";

export function SourcesEditDialog({
  source,
  open,
  disabled = false,
  onOpenChange,
}: {
  source: SourceSummary | null;
  open: boolean;
  disabled?: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations();
  const [pending, setPending] = React.useState(false);
  const { updateSource, invalidateSources } = useSourceMutations();

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!pending) {
          onOpenChange(nextOpen);
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("sources.form.edit.title")}</DialogTitle>
          <DialogDescription>{t("sources.form.edit.description")}</DialogDescription>
        </DialogHeader>

        {source ? (
          <EditSourceForm
            key={source.id}
            showHeader={false}
            framed={false}
            source={source}
            pending={disabled || pending}
            onCancel={() => onOpenChange(false)}
            onSubmit={async (input) => {
              setPending(true);
              try {
                await updateSource({ data: input });
                await invalidateSources();
                onOpenChange(false);
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
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
