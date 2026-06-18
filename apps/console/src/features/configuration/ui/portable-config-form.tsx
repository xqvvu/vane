import { RiDownloadLine, RiFileCodeLine, RiUploadLine } from "@remixicon/react";
import { ClientOnly } from "@tanstack/react-router";
import * as React from "react";

import { TomlEditor } from "#/components/codemirror/toml-editor.tsx";
import { Badge } from "#/components/ui/badge.tsx";
import { Button } from "#/components/ui/button.tsx";
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "#/components/ui/popover.tsx";
import { Textarea } from "#/components/ui/textarea.tsx";
import { useTranslations } from "#/i18n/use-i18n.ts";

export function PortableConfigForm({
  value,
  pending,
  onChange,
  onExport,
  onImport,
}: {
  value: string;
  pending: boolean;
  onChange: (value: string) => void;
  onExport: () => Promise<unknown>;
  onImport: (toml: string) => Promise<unknown>;
}) {
  const t = useTranslations();
  const [confirmImportOpen, setConfirmImportOpen] = React.useState(false);
  const canImport = !pending && value.trim().length > 0;

  function confirmImport() {
    setConfirmImportOpen(false);
    void onImport(value);
  }

  return (
    <section className="border-border bg-card min-w-0 border">
      <div className="border-border flex flex-col gap-2 border-b px-3 py-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <RiFileCodeLine className="size-4" aria-hidden />
            {t("configuration.portableConfig.title")}
            <Badge variant="outline" className="font-mono text-[10px]">
              {t("configuration.portableConfig.tomlLabel")}
            </Badge>
          </h2>
          <p className="text-muted-foreground mt-1 text-xs leading-5">
            {t("configuration.portableConfig.description")}
          </p>
        </div>
      </div>
      <div className="border-border bg-muted/30 flex flex-col gap-2 border-b p-3 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={onExport}
          className="sm:w-fit"
        >
          <RiDownloadLine data-icon="inline-start" aria-hidden />
          {t("configuration.portableConfig.exportCurrent")}
        </Button>
        <Popover
          open={confirmImportOpen}
          onOpenChange={(open) => {
            if (!pending) {
              setConfirmImportOpen(open);
            }
          }}
        >
          <PopoverTrigger
            render={
              <Button
                type="button"
                size="sm"
                disabled={!canImport}
                className="sm:w-fit"
                aria-label={t("configuration.portableConfig.applyImport")}
              />
            }
          >
            <RiUploadLine data-icon="inline-start" aria-hidden />
            {t("configuration.portableConfig.applyImport")}
          </PopoverTrigger>
          <PopoverContent align="end" side="bottom" sideOffset={6} className="w-80">
            <PopoverHeader>
              <PopoverTitle>{t("configuration.portableConfig.confirmImportTitle")}</PopoverTitle>
              <PopoverDescription>
                {t("configuration.portableConfig.confirmImportDescription")}
              </PopoverDescription>
            </PopoverHeader>
            <div className="flex justify-end gap-2">
              <PopoverClose render={<Button type="button" variant="outline" size="sm" />}>
                {t("configuration.portableConfig.cancelImport")}
              </PopoverClose>
              <Button type="button" size="sm" disabled={!canImport} onClick={confirmImport}>
                <RiUploadLine data-icon="inline-start" aria-hidden />
                {t("configuration.portableConfig.confirmImport")}
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <div className="min-w-0 p-3">
        <ClientOnly
          fallback={
            <Textarea
              id="portable-config-toml"
              className="bg-background text-foreground min-h-112 resize-y font-mono text-xs leading-5"
              placeholder={t("configuration.portableConfig.tomlPlaceholder")}
              value={value}
              readOnly
            />
          }
        >
          <React.Suspense fallback={<TomlEditor.Skeleton />}>
            <TomlEditor
              id="portable-config-toml"
              value={value}
              placeholder={t("configuration.portableConfig.tomlPlaceholder")}
              onChange={onChange}
            />
          </React.Suspense>
        </ClientOnly>
      </div>
    </section>
  );
}
