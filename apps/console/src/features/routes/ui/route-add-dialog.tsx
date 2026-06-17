import { RiAddLine } from "@remixicon/react";
import * as React from "react";

import { Button } from "#/components/ui/button.tsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "#/components/ui/dialog.tsx";
import type { Configuration } from "#/features/configuration/model/configuration-types.ts";
import { CreateRouteForm } from "#/features/routes/ui/route-forms.tsx";
import { useTranslations } from "#/i18n/use-i18n.ts";

export function RouteAddDialog({
  sources,
  destinations,
  disabled = false,
  pending,
  onSubmit,
}: {
  sources: Configuration["sources"];
  destinations: Configuration["destinations"];
  disabled?: boolean;
  pending: boolean;
  onSubmit: (input: {
    name: string;
    rule: Configuration["routes"][number]["rule"];
    destinationIds: string[];
  }) => void;
}) {
  const t = useTranslations();
  const [open, setOpen] = React.useState(false);

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
            title={t("routing.page.addTitle")}
            className="w-fit"
          />
        }
      >
        <RiAddLine data-icon="inline-start" aria-hidden />
        {t("common.actions.add")}
      </DialogTrigger>

      <DialogContent className="max-h-[min(720px,calc(100dvh-2rem))] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("routing.form.create.title")}</DialogTitle>
          <DialogDescription>{t("routing.form.create.description")}</DialogDescription>
        </DialogHeader>

        <CreateRouteForm
          showHeader={false}
          sources={sources}
          destinations={destinations}
          pending={disabled || pending}
          onSubmit={(input) => {
            onSubmit(input);
            setOpen(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
