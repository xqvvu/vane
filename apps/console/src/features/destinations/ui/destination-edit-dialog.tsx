import { useQuery } from "@tanstack/react-query";
import * as React from "react";
import { Refresh } from "reicon-react";
import { toast } from "sonner";

import { ConfigurationDialogContent } from "#/components/common/configuration-dialog-content.tsx";
import { Alert, AlertDescription, AlertTitle } from "#/components/ui/alert.tsx";
import { Button } from "#/components/ui/button.tsx";
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from "#/components/ui/dialog.tsx";
import { useDestinationMutations } from "#/features/destinations/api/destination.mutations.ts";
import { destinationTemplateDraftQueryOptions } from "#/features/destinations/api/destination.queries.ts";
import type {
  DestinationCatalog,
  DestinationSubmitResult,
  DestinationSummary,
  PreviewEditDestinationFormInput,
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
  onPreview: (input: PreviewEditDestinationFormInput) => DestinationSubmitResult;
}) {
  const t = useTranslations();
  const [pending, setPending] = React.useState(false);
  const { invalidateDestinations, updateDestination } = useDestinationMutations();
  const templateDraftQuery = useQuery({
    ...destinationTemplateDraftQueryOptions(destination?.id ?? ""),
    enabled: open && destination !== null,
  });

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

        {destination && templateDraftQuery.data ? (
          <EditDestinationForm
            destinationCatalog={destinationCatalog}
            key={destination.id}
            showHeader={false}
            framed={false}
            layout="dialog"
            destination={destination}
            templateDraft={templateDraftQuery.data.template}
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
        ) : destination && templateDraftQuery.isError ? (
          <Alert variant="destructive">
            <AlertTitle>{t("destinations.form.templateDraftLoadError")}</AlertTitle>
            <AlertDescription className="flex flex-col items-start gap-2">
              <span>
                {templateDraftQuery.error instanceof Error
                  ? templateDraftQuery.error.message
                  : String(templateDraftQuery.error)}
              </span>
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={() => void templateDraftQuery.refetch()}
              >
                <Refresh data-icon="inline-start" aria-hidden />
                {t("common.actions.retry")}
              </Button>
            </AlertDescription>
          </Alert>
        ) : destination ? (
          <EditDestinationForm.Skeleton />
        ) : null}
      </ConfigurationDialogContent>
    </Dialog>
  );
}
