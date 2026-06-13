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
import { useTranslations } from "#/i18n/use-i18n.ts";
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
  const t = useTranslations();

  return (
    <section className="bg-background">
      <DashboardTable
        variant="flush"
        empty={<DestinationsEmptyState />}
        headers={[
          t("destinations.table.headers.destination"),
          t("destinations.table.headers.kind"),
          t("destinations.table.headers.safeConfiguration"),
          t("destinations.table.headers.state"),
          t("destinations.table.headers.actions"),
        ]}
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
                variant="ghost"
                size="xs"
                disabled={pending}
                title={t("destinations.table.actions.testTitle", { name: destination.name })}
                onClick={() => onTest(destination)}
              >
                <RiPlayLine data-icon="inline-start" aria-hidden />
                {t("destinations.table.actions.test")}
              </Button>
              <Button
                variant="ghost"
                size="xs"
                disabled={pending}
                title={t("destinations.table.actions.previewTitle", {
                  name: destination.name,
                })}
                onClick={() => onPreview(destination)}
              >
                <RiEyeLine data-icon="inline-start" aria-hidden />
                {t("destinations.table.actions.preview")}
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                disabled={pending}
                title={t("destinations.table.actions.edit")}
                onClick={() => onEdit(destination.id)}
              >
                <RiEditLine data-icon aria-hidden />
              </Button>
              <Button
                variant="ghost"
                size="xs"
                disabled={pending}
                title={
                  destination.enabled
                    ? t("destinations.table.actions.disableTitle")
                    : t("destinations.table.actions.enableTitle")
                }
                onClick={() => onToggle(destination)}
              >
                <RiShutDownLine data-icon="inline-start" aria-hidden />
                {destination.enabled
                  ? t("destinations.table.actions.disable")
                  : t("destinations.table.actions.enable")}
              </Button>
            </div>,
          ],
        }))}
      />
      {destinations.length > 0 ? (
        <div className="border-border bg-background border-t py-4 text-center">
          <span className="text-muted-foreground text-[11px] font-bold tracking-[0.18em] uppercase">
            {t("destinations.table.end")}
          </span>
        </div>
      ) : null}
      {editingDestination ? (
        <div className="border-border border-t p-3">
          <EditDestinationForm
            key={editingDestination.id}
            destination={editingDestination}
            pending={pending}
            onCancel={onCancelEdit}
            onPreview={onPreviewEdit}
            onSubmit={onSubmitEdit}
          />
        </div>
      ) : null}
    </section>
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
  const t = useTranslations();

  return (
    <Badge variant="outline" className="max-w-full truncate font-normal">
      {t(`destinations.kinds.${kind}`)}
    </Badge>
  );
}

function SafeConfigCell({ destination }: { destination: DestinationSummary }) {
  const t = useTranslations();

  return (
    <div className="min-w-0">
      <div className="truncate text-xs">{t(`destinations.kinds.${destination.kind}`)}</div>
      <div className="text-muted-foreground mt-0.5 truncate text-[11px]">
        {t("destinations.table.safeConfig.secrets")}
      </div>
    </div>
  );
}

function DestinationsEmptyState() {
  const t = useTranslations();

  return (
    <Empty className="border-0 py-3">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <RiArrowRightLine aria-hidden />
        </EmptyMedia>
        <EmptyTitle>{t("destinations.table.empty.title")}</EmptyTitle>
        <EmptyDescription>{t("destinations.table.empty.description")}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
