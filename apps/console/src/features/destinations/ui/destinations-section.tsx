import type { ColumnDef } from "@tanstack/react-table";
import * as React from "react";

import type { RouteDefinition } from "@vane/core";

import { EnabledStateBadge } from "#/components/common/enabled-state-badge";
import { OperationsTable } from "#/components/common/operations-table";
import { destinationRouteCoverage } from "#/features/destinations/model/destination-route-coverage";
import type { DestinationSummary } from "#/features/destinations/model/destination-types";
import { DestinationActions } from "#/features/destinations/ui/destination-actions";
import { DestinationIdentityCell } from "#/features/destinations/ui/destination-identity-cell";
import { DestinationRouteCoverageCell } from "#/features/destinations/ui/destination-route-coverage-cell";
import { DestinationsEmptyState } from "#/features/destinations/ui/destinations-empty-state";
import { useTranslations } from "#/i18n/use-i18n";

export interface DestinationsSectionProps {
  destinations: DestinationSummary[];
  routes: RouteDefinition[];
  pending: boolean;
  onTest: (destination: DestinationSummary) => void;
  onPreview: (destination: DestinationSummary) => void;
  onEdit: (destinationId: string) => void;
  onToggle: (destination: DestinationSummary) => void;
  onDelete: (destination: DestinationSummary) => void;
}

export function DestinationsSection({
  destinations,
  routes,
  pending,
  onTest,
  onPreview,
  onEdit,
  onToggle,
  onDelete,
}: DestinationsSectionProps) {
  const t = useTranslations();
  const data = React.useMemo(() => destinations, [destinations]);
  const columns = React.useMemo<Array<ColumnDef<DestinationSummary>>>(
    () => [
      {
        id: "destination",
        header: t("destinations.table.headers.destination"),
        cell: ({ row }) => <DestinationIdentityCell destination={row.original} />,
      },
      {
        id: "routing",
        header: t("destinations.table.headers.routing"),
        cell: ({ row }) => (
          <DestinationRouteCoverageCell
            coverage={destinationRouteCoverage(row.original.id, routes)}
          />
        ),
      },
      {
        id: "status",
        header: t("destinations.table.headers.status"),
        cell: ({ row }) => <EnabledStateBadge enabled={row.original.enabled} />,
      },
      {
        id: "actions",
        header: t("destinations.table.headers.actions"),
        cell: ({ row }) => (
          <DestinationActions
            destination={row.original}
            pending={pending}
            onTest={onTest}
            onPreview={onPreview}
            onEdit={onEdit}
            onToggle={onToggle}
            onDelete={onDelete}
          />
        ),
      },
    ],
    [onDelete, onEdit, onPreview, onTest, onToggle, pending, routes, t],
  );

  return (
    <OperationsTable
      data={data}
      columns={columns}
      pageSize={destinationsPageSize}
      emptyState={<DestinationsEmptyState />}
      getRowId={(destination) => destination.id}
      columnClassName={destinationsColumnClassName}
      isPrimaryColumn={(columnId) => columnId === "destination"}
      rangeLabel={({ total }) => t("destinations.table.pagination.range", { total })}
      emptyRangeLabel={t("destinations.table.pagination.empty")}
      pageLabel={({ page, pageCount }) =>
        t("destinations.table.pagination.page", { page, pageCount })
      }
      previousLabel={t("destinations.table.pagination.previous")}
      nextLabel={t("destinations.table.pagination.next")}
    />
  );
}

function destinationsColumnClassName(columnId: string): string | null {
  switch (columnId) {
    case "destination":
      return "w-[35%]";
    case "routing":
      return "w-[18%]";
    case "status":
      return "w-[14%]";
    case "actions":
      return "w-[33%]";
    default:
      return null;
  }
}

const destinationsPageSize = 10;
