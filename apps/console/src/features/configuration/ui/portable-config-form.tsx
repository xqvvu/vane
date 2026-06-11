import { RiDatabase2Line } from "@remixicon/react";

import { DashboardFormPanel } from "#/app/shell/dashboard-panel.tsx";
import { Button } from "#/components/ui/button.tsx";
import { Textarea } from "#/components/ui/textarea.tsx";

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
      <div className="flex flex-col gap-2">
        <Textarea
          className="min-h-40 resize-y font-mono text-[11px]"
          value={value}
          onChange={(event) => onChange(event.currentTarget.value)}
        />
        <div className="grid grid-cols-2 gap-2">
          <Button type="button" variant="outline" size="sm" disabled={pending} onClick={onExport}>
            Export
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={pending || value.trim().length === 0}
            onClick={() => void onImport(value)}
          >
            Import
          </Button>
        </div>
      </div>
    </DashboardFormPanel>
  );
}
