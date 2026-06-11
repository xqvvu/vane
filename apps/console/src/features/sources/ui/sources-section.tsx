import { RiEditLine, RiKey2Line, RiWebhookLine } from "@remixicon/react";

import { DashboardPanel } from "#/app/shell/dashboard-panel.tsx";
import { DashboardTable } from "#/app/shell/dashboard-table.tsx";
import { Button } from "#/components/ui/button.tsx";
import type { Configuration } from "#/features/configuration/model/configuration-types.ts";
import { ConfigurationStateBadge } from "#/features/configuration/ui/configuration-state-badge.tsx";
import { EditSourceForm } from "#/features/sources/ui/source-forms.tsx";
import { SourceWebhookCell } from "#/features/sources/ui/source-webhook-cell.tsx";

export interface SourcesSectionProps {
  sources: Configuration["sources"];
  editingSource: Configuration["sources"][number] | null;
  pending: boolean;
  onEdit: (sourceId: string) => void;
  onCancelEdit: () => void;
  onToggle: (source: Configuration["sources"][number]) => void;
  onRotateToken: (source: Configuration["sources"][number]) => void;
  onSubmitEdit: (input: {
    id: string;
    name: string;
    provider: Configuration["sources"][number]["provider"];
    config?: import("@vane/core").JsonObject;
  }) => void;
}

export function SourcesSection({
  sources,
  editingSource,
  pending,
  onEdit,
  onCancelEdit,
  onToggle,
  onRotateToken,
  onSubmitEdit,
}: SourcesSectionProps) {
  return (
    <DashboardPanel
      title="Sources"
      icon={<RiWebhookLine className="size-4" aria-hidden />}
      action={<span className="text-muted-foreground text-xs">{sources.length} configured</span>}
    >
      <DashboardTable
        empty="No sources yet"
        headers={["Name", "Provider", "Webhook", "State", ""]}
        rows={sources.map((source) => ({
          key: source.id,
          cells: [
            source.name,
            source.provider,
            <SourceWebhookCell key="webhook" sourceId={source.id} />,
            <ConfigurationStateBadge key="state" enabled={source.enabled} />,
            <div key="actions" className="flex justify-end gap-1">
              <Button
                variant="outline"
                size="icon-xs"
                disabled={pending}
                title="Edit source"
                onClick={() => onEdit(source.id)}
              >
                <RiEditLine aria-hidden />
              </Button>
              <Button
                variant="outline"
                size="xs"
                disabled={pending}
                onClick={() => onToggle(source)}
              >
                {source.enabled ? "Disable" : "Enable"}
              </Button>
              <Button
                variant="outline"
                size="xs"
                disabled={pending}
                onClick={() => onRotateToken(source)}
              >
                <RiKey2Line aria-hidden />
                Rotate
              </Button>
            </div>,
          ],
        }))}
      />
      {editingSource ? (
        <EditSourceForm
          key={editingSource.id}
          source={editingSource}
          pending={pending}
          onCancel={onCancelEdit}
          onSubmit={onSubmitEdit}
        />
      ) : null}
    </DashboardPanel>
  );
}
