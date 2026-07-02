import { RiAddLine } from "@remixicon/react";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "#/components/ui/button.tsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "#/components/ui/dialog.tsx";
import { useDestinationMutations } from "#/features/destinations/api/destination.mutations.ts";
import { CreateDestinationForm } from "#/features/destinations/ui/create-destination-form.tsx";
import type {
  CreateDestinationFormInput,
  DestinationSubmitResult,
} from "#/features/destinations/ui/destination-ui-types.ts";
import { useTranslations } from "#/i18n/use-i18n.ts";

export function DestinationAddDialog({
  disabled = false,
  onPreview,
}: {
  disabled?: boolean;
  onPreview: (input: CreateDestinationFormInput) => DestinationSubmitResult;
}) {
  const t = useTranslations();
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const { createDestination, invalidateDestinations } = useDestinationMutations();

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
            title={t("destinations.page.addTitle")}
            className="w-fit"
          />
        }
      >
        <RiAddLine data-icon="inline-start" aria-hidden />
        {t("common.actions.add")}
      </DialogTrigger>

      <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col overflow-hidden sm:max-w-5xl">
        <DialogHeader className="shrink-0 pr-8">
          <DialogTitle>{t("destinations.form.create.title")}</DialogTitle>
          <DialogDescription>{t("destinations.form.create.description")}</DialogDescription>
        </DialogHeader>

        <CreateDestinationForm
          showHeader={false}
          layout="dialog"
          pending={disabled || pending}
          onPreview={onPreview}
          onSubmit={async (data) => {
            setPending(true);
            try {
              await createDestination({ data });
              await invalidateDestinations();
              setOpen(false);
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
      </DialogContent>
    </Dialog>
  );
}
