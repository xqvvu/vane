import * as React from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog.tsx";
import { useDestinationMutations } from "#/features/destinations/api/destination.mutations.ts";
import type {
  DestinationSubmitResult,
  DestinationSummary,
  EditDestinationFormInput,
} from "#/features/destinations/ui/destination-ui-types.ts";
import { EditDestinationForm } from "#/features/destinations/ui/edit-destination-form.tsx";
import { useTranslations } from "#/i18n/use-i18n.ts";

export function DestinationEditDialog({
  destination,
  open,
  disabled = false,
  onOpenChange,
  onPreview,
}: {
  destination: DestinationSummary | null;
  open: boolean;
  disabled?: boolean;
  onOpenChange: (open: boolean) => void;
  onPreview: (input: EditDestinationFormInput) => DestinationSubmitResult;
}) {
  const t = useTranslations();
  const [pending, setPending] = React.useState(false);
  const { invalidateDestinations, updateDestination } = useDestinationMutations();

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!pending) {
          onOpenChange(nextOpen);
        }
      }}
    >
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col overflow-hidden sm:max-w-5xl">
        <DialogHeader className="shrink-0 pr-8">
          <DialogTitle>{t("destinations.form.edit.title")}</DialogTitle>
          <DialogDescription>{t("destinations.form.edit.description")}</DialogDescription>
        </DialogHeader>

        {destination ? (
          <EditDestinationForm
            key={destination.id}
            showHeader={false}
            framed={false}
            layout="dialog"
            destination={destination}
            pending={disabled || pending}
            onCancel={() => onOpenChange(false)}
            onPreview={onPreview}
            onSubmit={async (input) => {
              setPending(true);
              try {
                await updateDestination({ data: input });
                await invalidateDestinations();
                onOpenChange(false);
              } catch (error) {
                toast.error(t("destinations.page.operationFailed"), {
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
