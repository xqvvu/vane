import {
  RiArrowRightLine,
  RiEditLine,
  RiEyeLine,
  RiPlayLine,
  RiShutDownLine,
} from "@remixicon/react";
import type { JsonObject } from "@vane/core";

import { Badge } from "#/components/ui/badge.tsx";
import { Button } from "#/components/ui/button.tsx";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "#/components/ui/empty.tsx";
import type { Configuration } from "#/features/configuration/model/configuration-types.ts";
import { ConfigurationStateBadge } from "#/features/configuration/ui/configuration-state-badge.tsx";
import type { DestinationFormKind } from "#/features/destinations/model/destination-form.ts";
import { EditDestinationForm } from "#/features/destinations/ui/destination-forms.tsx";
import { DashboardPanel } from "#/shell/dashboard-panel.tsx";
import { DashboardTable } from "#/shell/dashboard-table.tsx";

type DestinationSummary = Configuration["destinations"][number];

export interface DestinationsSectionProps {
  destinations: DestinationSummary[];
  editingDestination: DestinationSummary | null;
  pending: boolean;
  onTest: (destination: DestinationSummary) => void;
  onPreview: (destination: DestinationSummary) => void;
  onEdit: (destinationId: string) => void;
  onToggle: (destination: DestinationSummary) => void;
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
        empty={<DestinationsEmptyState />}
        headers={["Destination", "Kind", "Safe configuration", "State", ""]}
        columnClassNames={["w-[24%]", "w-[15%]", "w-[25%]", "w-[12%]", "w-[24%] text-right"]}
        rows={destinations.map((destination) => ({
          key: destination.id,
          cells: [
            <DestinationIdentityCell key="identity" destination={destination} />,
            <KindBadge key="kind" kind={destination.kind} />,
            <SafeConfigCell key="config" destination={destination} />,
            <ConfigurationStateBadge key="state" enabled={destination.enabled} />,
            <div key="actions" className="flex min-w-0 justify-end gap-1">
              <Button
                variant="outline"
                size="xs"
                disabled={pending}
                title={`Test ${destination.name}`}
                onClick={() => onTest(destination)}
              >
                <RiPlayLine data-icon="inline-start" aria-hidden />
                Test
              </Button>
              <Button
                variant="outline"
                size="xs"
                disabled={pending}
                title={`Preview ${destination.name}`}
                onClick={() => onPreview(destination)}
              >
                <RiEyeLine data-icon="inline-start" aria-hidden />
                Preview
              </Button>
              <Button
                variant="outline"
                size="icon-xs"
                disabled={pending}
                title="Edit destination"
                onClick={() => onEdit(destination.id)}
              >
                <RiEditLine data-icon aria-hidden />
              </Button>
              <Button
                variant="outline"
                size="xs"
                disabled={pending}
                title={destination.enabled ? "Disable destination" : "Enable destination"}
                onClick={() => onToggle(destination)}
              >
                <RiShutDownLine data-icon="inline-start" aria-hidden />
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

function DestinationIdentityCell({ destination }: { destination: DestinationSummary }) {
  return (
    <div className="min-w-0">
      <div className="truncate text-xs font-medium">{destination.name}</div>
      <div className="text-muted-foreground mt-0.5 truncate font-mono text-[11px]">
        {destination.id}
      </div>
    </div>
  );
}

function KindBadge({ kind }: { kind: DestinationFormKind }) {
  return (
    <Badge variant="outline" className="max-w-full truncate font-normal">
      {destinationKindLabel(kind)}
    </Badge>
  );
}

function SafeConfigCell({ destination }: { destination: DestinationSummary }) {
  return (
    <div className="min-w-0">
      <div className="truncate text-xs">{safeConfigSummary(destination.kind)}</div>
      <div className="text-muted-foreground mt-0.5 truncate text-[11px]">
        Secrets stay server-side and are omitted from UI data.
      </div>
    </div>
  );
}

function DestinationsEmptyState() {
  return (
    <Empty className="border-0 py-3">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <RiArrowRightLine aria-hidden />
        </EmptyMedia>
        <EmptyTitle>No destinations configured</EmptyTitle>
        <EmptyDescription>
          Create a destination before routes can send delivery jobs.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

function destinationKindLabel(kind: DestinationFormKind) {
  switch (kind) {
    case "email":
      return "Email";
    case "feishu":
      return "Feishu";
    case "generic_webhook":
      return "Generic webhook";
    case "slack":
      return "Slack";
  }
}

function safeConfigSummary(kind: DestinationFormKind) {
  switch (kind) {
    case "email":
      return "Gateway, recipients, and headers are redacted";
    case "feishu":
      return "Robot webhook and optional signing secret are redacted";
    case "generic_webhook":
      return "Webhook endpoint, method, and headers are redacted";
    case "slack":
      return "Slack webhook endpoint is redacted";
  }
}
