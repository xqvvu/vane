import { RiAddCircleLine, RiAddLine } from "@remixicon/react";

import { SourceForm } from "#/features/sources/ui/source-form";
import type {
  CreateSourceFormInput,
  SourceSubmitResult,
} from "#/features/sources/ui/source-ui-types";
import { useTranslations } from "#/i18n/use-i18n";

export function CreateSourceForm({
  showHeader = true,
  layout = "panel",
  pending,
  onSubmit,
}: {
  showHeader?: boolean;
  layout?: "dialog" | "panel";
  pending: boolean;
  onSubmit: (input: CreateSourceFormInput) => SourceSubmitResult;
}) {
  const t = useTranslations();
  const isDialogLayout = layout === "dialog";

  return (
    <section className={isDialogLayout ? "flex min-h-0 flex-1 flex-col" : undefined}>
      {showHeader ? (
        <div className="mb-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <RiAddCircleLine className="size-4" aria-hidden />
            {t("sources.form.create.title")}
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {t("sources.form.create.description")}
          </p>
        </div>
      ) : null}
      <SourceForm
        defaultValues={{
          name: "",
          provider: "generic",
        }}
        pending={pending}
        submitLabel={t("sources.form.create.submit")}
        submitIcon={<RiAddLine data-icon="inline-start" aria-hidden />}
        layout={isDialogLayout ? "dialog" : "rail"}
        bodyFooter={
          isDialogLayout ? (
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              {t("sources.form.create.afterCreateHint")}
            </p>
          ) : null
        }
        onSubmit={onSubmit}
      />
      {isDialogLayout ? null : (
        <p className="text-muted-foreground mt-3 text-[11px] leading-relaxed">
          {t("sources.form.create.afterCreateHint")}
        </p>
      )}
    </section>
  );
}
