import { RiEditLine } from "@remixicon/react";

import {
  createDestinationDefaults,
  DestinationForm,
} from "#/features/destinations/ui/destination-form.tsx";
import type {
  DestinationCatalog,
  DestinationSubmitResult,
  DestinationSummary,
  EditDestinationFormInput,
} from "#/features/destinations/ui/destination-ui-types.ts";
import { useTranslations } from "#/i18n/use-i18n.ts";

export function EditDestinationForm({
  destinationCatalog,
  showHeader = true,
  framed = true,
  layout = "panel",
  destination,
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
  pending: boolean;
  onCancel: () => void;
  onPreview: (input: EditDestinationFormInput) => DestinationSubmitResult;
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
