import { RiArrowRightLine } from "@remixicon/react";

import {
  createDestinationDefaults,
  DestinationForm,
} from "#/features/destinations/ui/destination-form.tsx";
import type {
  CreateDestinationFormInput,
  DestinationSubmitResult,
} from "#/features/destinations/ui/destination-ui-types.ts";
import { useTranslations } from "#/i18n/use-i18n.ts";
import { DashboardFormPanel } from "#/shell/dashboard-panel.tsx";

export function CreateDestinationForm({
  showHeader = true,
  pending,
  onPreview,
  onSubmit,
}: {
  showHeader?: boolean;
  pending: boolean;
  onPreview: (input: CreateDestinationFormInput) => DestinationSubmitResult;
  onSubmit: (input: CreateDestinationFormInput) => DestinationSubmitResult;
}) {
  const t = useTranslations();

  const form = (
    <DestinationForm
      mode="create"
      pending={pending}
      defaultValues={createDestinationDefaults()}
      onPreview={onPreview}
      onSubmit={onSubmit}
    />
  );

  if (!showHeader) {
    return form;
  }

  return (
    <DashboardFormPanel
      title={t("destinations.form.create.title")}
      icon={<RiArrowRightLine aria-hidden />}
    >
      <p className="text-muted-foreground mb-3 text-xs leading-5">
        {t("destinations.form.create.description")}
      </p>
      {form}
    </DashboardFormPanel>
  );
}
