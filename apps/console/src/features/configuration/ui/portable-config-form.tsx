import { RiDatabase2Line, RiDownloadLine, RiUploadLine } from "@remixicon/react";

import { Button } from "#/components/ui/button.tsx";
import {
  Field as UiField,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "#/components/ui/field.tsx";
import { Textarea } from "#/components/ui/textarea.tsx";
import { useTranslations } from "#/i18n/use-i18n.ts";
import { DashboardFormPanel } from "#/shell/dashboard-panel.tsx";

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
    <DashboardFormPanel
      title={t("configuration.portableConfig.title")}
      icon={<RiDatabase2Line className="size-4" aria-hidden />}
    >
      <div className="flex flex-col gap-3">
        <FieldGroup className="gap-2">
          <UiField>
            <FieldLabel htmlFor="portable-config-toml">
              {t("configuration.portableConfig.tomlLabel")}
            </FieldLabel>
            <Textarea
              id="portable-config-toml"
              className="min-h-56 resize-y font-mono text-[11px]"
              placeholder={t("configuration.portableConfig.tomlPlaceholder")}
              value={value}
              onChange={(event) => onChange(event.currentTarget.value)}
            />
            <FieldDescription>{t("configuration.portableConfig.description")}</FieldDescription>
          </UiField>
        </FieldGroup>
        <div className="grid grid-cols-2 gap-2">
          <Button type="button" variant="outline" size="sm" disabled={pending} onClick={onExport}>
            <RiDownloadLine data-icon="inline-start" aria-hidden />
            {t("common.actions.export")}
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={pending || value.trim().length === 0}
            onClick={() => void onImport(value)}
          >
            <RiUploadLine data-icon="inline-start" aria-hidden />
            {t("common.actions.import")}
          </Button>
        </div>
      </div>
    </DashboardFormPanel>
  );
}
