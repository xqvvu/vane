import { RiAddCircleLine, RiAddLine } from "@remixicon/react";

import { SourceForm } from "#/features/sources/ui/source-form.tsx";
import type {
  CreateSourceFormInput,
  SourceSubmitResult,
} from "#/features/sources/ui/source-ui-types.ts";
import { useTranslations } from "#/i18n/use-i18n.ts";

export function CreateSourceForm({
  showHeader = true,
  pending,
  onSubmit,
}: {
  showHeader?: boolean;
  pending: boolean;
  onSubmit: (input: CreateSourceFormInput) => SourceSubmitResult;
}) {
  const t = useTranslations();

  return (
    <section>
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
        layout="rail"
        onSubmit={onSubmit}
      />
      <p className="text-muted-foreground mt-3 text-[11px] leading-relaxed">
        {t("sources.form.create.afterCreateHint")}
      </p>
    </section>
  );
}
