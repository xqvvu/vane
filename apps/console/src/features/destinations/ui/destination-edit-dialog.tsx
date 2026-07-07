import * as React from "react";
import { toast } from "sonner";

import { ConfigurationDialogContent } from "#/components/common/configuration-dialog-content.tsx";
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from "#/components/ui/dialog.tsx";
import { useDestinationMutations } from "#/features/destinations/api/destination.mutations.ts";
import type {
  DestinationCatalog,
  DestinationSubmitResult,
  DestinationSummary,
  EditDestinationFormInput,
} from "#/features/destinations/ui/destination-ui-types.ts";
import { EditDestinationForm } from "#/features/destinations/ui/edit-destination-form.tsx";
import { useTranslations } from "#/i18n/use-i18n.ts";

export function DestinationEditDialog({
  destinationCatalog,
  destination,
  open,
  disabled = false,
  onOpenChange,
  onPreview,
}: {
  destinationCatalog: DestinationCatalog;
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
      <ConfigurationDialogContent>
        <DialogHeader className="shrink-0 pr-8">
          <DialogTitle>{t("destinations.form.edit.title")}</DialogTitle>
          <DialogDescription>{t("destinations.form.edit.description")}</DialogDescription>
        </DialogHeader>

        {destination ? (
          <EditDestinationForm
            destinationCatalog={destinationCatalog}
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
      </ConfigurationDialogContent>
    </Dialog>
  );
}
