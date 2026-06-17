import { RiDownloadLine, RiFileCodeLine, RiUploadLine } from "@remixicon/react";
import { ClientOnly } from "@tanstack/react-router";
import * as React from "react";

import { TomlEditor } from "#/components/codemirror/toml-editor";
import { Badge } from "#/components/ui/badge.tsx";
import { Button } from "#/components/ui/button.tsx";
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
      <div className="min-w-0 p-3">
        <ClientOnly
          fallback={
            <Textarea
              id="portable-config-toml"
              className="bg-background text-foreground min-h-[28rem] resize-y font-mono text-[11px]"
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
      <div className="border-border bg-muted/30 flex flex-col gap-2 border-t p-3 sm:flex-row sm:justify-end">
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
        <Button
          type="button"
          size="sm"
          disabled={pending || value.trim().length === 0}
          onClick={() => void onImport(value)}
          className="sm:w-fit"
        >
          <RiUploadLine data-icon="inline-start" aria-hidden />
          {t("configuration.portableConfig.applyImport")}
        </Button>
      </div>
    </section>
  );
}
