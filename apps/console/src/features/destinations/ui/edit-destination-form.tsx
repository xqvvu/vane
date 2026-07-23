import { RiEditLine } from "@remixicon/react";

import type { JsonObject } from "@vane/core";

import { Skeleton } from "#/components/ui/skeleton";
import { destinationTemplateFormStateFromDraft } from "#/features/destinations/model/destination-form";
import {
  createDestinationDefaults,
  DestinationForm,
} from "#/features/destinations/ui/destination-form";
import type {
  DestinationCatalog,
  DestinationSubmitResult,
  DestinationSummary,
  EditDestinationFormInput,
  PreviewEditDestinationFormInput,
} from "#/features/destinations/ui/destination-ui-types";
import { useTranslations } from "#/i18n/use-i18n";

export function EditDestinationForm({
  destinationCatalog,
  showHeader = true,
  framed = true,
  layout = "panel",
  destination,
  templateDraft,
  pending,
  onCancel,
  onPreview,
  onSubmit,
}: {
  destinationCatalog: DestinationCatalog;
  showHeader?: boolean;
  framed?: boolean;
  layout?: "panel" | "dialog";
  destination: DestinationSummary;
  templateDraft: JsonObject | null;
  pending: boolean;
  onCancel: () => void;
  onPreview: (input: PreviewEditDestinationFormInput) => DestinationSubmitResult;
  onSubmit: (input: EditDestinationFormInput) => DestinationSubmitResult;
}) {
  const t = useTranslations();

  return (
    <section className={framed ? "border-border bg-muted/30 mt-3 border p-3" : undefined}>
      {showHeader ? (
        <div className="mb-3">
          <h3 className="flex items-center gap-2 text-xs font-semibold">
            <RiEditLine aria-hidden />
            {t("destinations.form.edit.title")}
          </h3>
          <p className="text-muted-foreground mt-1 text-xs">
            {t("destinations.form.edit.description")}
          </p>
        </div>
      ) : null}
      <DestinationForm
        mode="edit"
        layout={layout}
        pending={pending}
        destinationCatalog={destinationCatalog}
        defaultValues={{
          ...createDestinationDefaults(),
          ...destinationTemplateFormStateFromDraft(templateDraft),
          name: destination.name,
          kind: destination.kind,
          method: "",
        }}
        onCancel={onCancel}
        onPreview={(input) =>
          onPreview({
            id: destination.id,
            ...input,
          })
        }
        onSubmit={(input) =>
          onSubmit({
            id: destination.id,
            ...input,
          })
        }
      />
    </section>
  );
}

EditDestinationForm.Skeleton = function EditDestinationFormSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-hidden>
      <Skeleton className="h-14 w-full" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-72 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
      <div className="flex justify-end gap-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-24" />
      </div>
    </div>
  );
};
