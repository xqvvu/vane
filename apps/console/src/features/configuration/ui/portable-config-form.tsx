import { RiDatabase2Line, RiDownloadLine, RiUploadLine } from "@remixicon/react";

import { Button } from "#/components/ui/button.tsx";
import {
  Field as UiField,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "#/components/ui/field.tsx";
import { Textarea } from "#/components/ui/textarea.tsx";
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
  return (
    <DashboardFormPanel
      title="Portable config"
      icon={<RiDatabase2Line className="size-4" aria-hidden />}
    >
      <div className="flex flex-col gap-3">
        <FieldGroup className="gap-2">
          <UiField>
            <FieldLabel htmlFor="portable-config-toml">TOML</FieldLabel>
            <Textarea
              id="portable-config-toml"
              className="min-h-56 resize-y font-mono text-[11px]"
              placeholder={"[settings]\nraw_payload_retention_days = 30"}
              value={value}
              onChange={(event) => onChange(event.currentTarget.value)}
            />
            <FieldDescription>
              Export omits plaintext secrets by default. Import validates structure before applying
              changes.
            </FieldDescription>
          </UiField>
        </FieldGroup>
        <div className="grid grid-cols-2 gap-2">
          <Button type="button" variant="outline" size="sm" disabled={pending} onClick={onExport}>
            <RiDownloadLine data-icon="inline-start" aria-hidden />
            Export
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={pending || value.trim().length === 0}
            onClick={() => void onImport(value)}
          >
            <RiUploadLine data-icon="inline-start" aria-hidden />
            Import
          </Button>
        </div>
      </div>
    </DashboardFormPanel>
  );
}
