import { Edit2 } from "reicon-react";

import { SourceForm } from "#/features/sources/ui/source-form.tsx";
import type {
  EditSourceFormInput,
  SourceSubmitResult,
  SourceSummary,
} from "#/features/sources/ui/source-ui-types.ts";
import { useTranslations } from "#/i18n/use-i18n.ts";

export function EditSourceForm({
  showHeader = true,
  framed = true,
  source,
  pending,
  onCancel,
  onSubmit,
}: {
  showHeader?: boolean;
  framed?: boolean;
  source: SourceSummary;
  pending: boolean;
  onCancel: () => void;
  onSubmit: (input: EditSourceFormInput) => SourceSubmitResult;
}) {
  const t = useTranslations();

  return (
    <section className={framed ? "border-border bg-muted/30 mt-3 border p-3" : undefined}>
      {showHeader ? (
        <>
          <h3 className="flex items-center gap-2 text-xs font-semibold">
            <Edit2 className="size-3.5" aria-hidden />
            {t("sources.form.edit.title")}
          </h3>
          <p className="text-muted-foreground mt-1 mb-3 text-xs">
            {t("sources.form.edit.description")}
          </p>
        </>
      ) : null}
      <SourceForm
        defaultValues={{
          name: source.name,
          provider: source.provider,
        }}
        pending={pending}
        submitLabel={t("sources.form.edit.submit")}
        submitIcon={<Edit2 data-icon="inline-start" aria-hidden />}
        onSubmit={(values) =>
          onSubmit({
            id: source.id,
            ...values,
          })
        }
        onCancel={onCancel}
      />
    </section>
  );
}
