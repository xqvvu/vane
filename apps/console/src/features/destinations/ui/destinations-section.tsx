import { RiArrowRightLine, RiEditLine, RiEyeLine, RiPlayLine } from "@remixicon/react";
import type { JsonObject } from "@vane/core";

import { DashboardPanel } from "#/app/shell/dashboard-panel.tsx";
import { DashboardTable } from "#/app/shell/dashboard-table.tsx";
import { Button } from "#/components/ui/button.tsx";
import type { Configuration } from "#/features/configuration/model/configuration-types.ts";
import { ConfigurationStateBadge } from "#/features/configuration/ui/configuration-state-badge.tsx";
import type { DestinationFormKind } from "#/features/destinations/model/destination-form.ts";
import { EditDestinationForm } from "#/features/destinations/ui/destination-forms.tsx";

export interface DestinationsSectionProps {
  destinations: Configuration["destinations"];
  editingDestination: Configuration["destinations"][number] | null;
  pending: boolean;
  onTest: (destination: Configuration["destinations"][number]) => void;
  onPreview: (destination: Configuration["destinations"][number]) => void;
  onEdit: (destinationId: string) => void;
  onToggle: (destination: Configuration["destinations"][number]) => void;
  onCancelEdit: () => void;
  onPreviewEdit: (input: { name: string; kind: DestinationFormKind; config: JsonObject }) => void;
  onSubmitEdit: (input: {
    id: string;
    name: string;
    kind: DestinationFormKind;
    config: JsonObject;
  }) => void;
}

export function DestinationsSection({
  destinations,
  editingDestination,
  pending,
  onTest,
  onPreview,
  onEdit,
  onToggle,
  onCancelEdit,
  onPreviewEdit,
  onSubmitEdit,
}: DestinationsSectionProps) {
  return (
    <DashboardPanel
      title="Destinations"
      icon={<RiArrowRightLine className="size-4" aria-hidden />}
      action={
        <span className="text-muted-foreground text-xs">{destinations.length} configured</span>
      }
    >
      <DashboardTable
        empty="No destinations yet"
        headers={["Name", "Kind", "State", ""]}
        rows={destinations.map((destination) => ({
          key: destination.id,
          cells: [
            destination.name,
            destination.kind,
            <ConfigurationStateBadge key="state" enabled={destination.enabled} />,
            <div key="actions" className="flex justify-end gap-1">
              <Button
                variant="outline"
                size="xs"
                disabled={pending}
                onClick={() => onTest(destination)}
              >
                <RiPlayLine aria-hidden />
                Test
              </Button>
              <Button
                variant="outline"
                size="xs"
                disabled={pending}
                onClick={() => onPreview(destination)}
              >
                <RiEyeLine aria-hidden />
                Preview
              </Button>
              <Button
                variant="outline"
                size="icon-xs"
                disabled={pending}
                title="Edit destination"
                onClick={() => onEdit(destination.id)}
              >
                <RiEditLine aria-hidden />
              </Button>
              <Button
                variant="outline"
                size="xs"
                disabled={pending}
                onClick={() => onToggle(destination)}
              >
                {destination.enabled ? "Disable" : "Enable"}
              </Button>
            </div>,
          ],
        }))}
      />
      {editingDestination ? (
        <EditDestinationForm
          key={editingDestination.id}
          destination={editingDestination}
          pending={pending}
          onCancel={onCancelEdit}
          onPreview={onPreviewEdit}
          onSubmit={onSubmitEdit}
        />
      ) : null}
    </DashboardPanel>
  );
}
