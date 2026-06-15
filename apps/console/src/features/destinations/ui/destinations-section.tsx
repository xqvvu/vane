import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState,
} from "@tanstack/react-table";
import * as React from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "#/components/ui/table.tsx";
import { ConfigurationStateBadge } from "#/features/configuration/ui/configuration-state-badge.tsx";
import { DestinationActions } from "#/features/destinations/ui/destination-actions.tsx";
import { DestinationIdentityCell } from "#/features/destinations/ui/destination-identity-cell.tsx";
import { DestinationKindBadge } from "#/features/destinations/ui/destination-kind-badge.tsx";
import { DestinationSafeConfigCell } from "#/features/destinations/ui/destination-safe-config-cell.tsx";
import type { DestinationSummary } from "#/features/destinations/ui/destination-ui-types.ts";
import { DestinationsEmptyState } from "#/features/destinations/ui/destinations-empty-state.tsx";
import { useTranslations } from "#/i18n/use-i18n.ts";
import { cn } from "#/lib/utils.ts";
import { DashboardTablePagination } from "#/shell/dashboard-table-pagination.tsx";

export interface DestinationsSectionProps {
  destinations: DestinationSummary[];
  pending: boolean;
  onTest: (destination: DestinationSummary) => void;
  onPreview: (destination: DestinationSummary) => void;
  onEdit: (destinationId: string) => void;
  onToggle: (destination: DestinationSummary) => void;
}

export function DestinationsSection({
  destinations,
  pending,
  onTest,
  onPreview,
  onEdit,
  onToggle,
}: DestinationsSectionProps) {
  const t = useTranslations();
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: destinationsPageSize,
  });
  const data = React.useMemo(() => destinations, [destinations]);
  const columns = React.useMemo<Array<ColumnDef<DestinationSummary>>>(
    () => [
      {
        id: "destination",
        header: t("destinations.table.headers.destination"),
        cell: ({ row }) => <DestinationIdentityCell destination={row.original} />,
      },
      {
        id: "kind",
        header: t("destinations.table.headers.kind"),
        cell: ({ row }) => <DestinationKindBadge kind={row.original.kind} />,
      },
      {
        id: "safeConfiguration",
        header: t("destinations.table.headers.safeConfiguration"),
        cell: ({ row }) => <DestinationSafeConfigCell destination={row.original} />,
      },
      {
        id: "state",
        header: t("destinations.table.headers.state"),
        cell: ({ row }) => <ConfigurationStateBadge enabled={row.original.enabled} />,
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
          />
        ),
      },
    ],
    [onEdit, onPreview, onTest, onToggle, pending, t],
  );

  React.useEffect(() => {
    setPagination((current) => {
      const nextPageCount = Math.max(Math.ceil(destinations.length / current.pageSize), 1);

      if (current.pageIndex < nextPageCount) {
        return current;
      }

      return {
        ...current,
        pageIndex: nextPageCount - 1,
      };
    });
  }, [destinations.length]);

  const table = useReactTable({
    data,
    columns,
    state: {
      pagination,
    },
    onPaginationChange: setPagination,
    getRowId: (destination) => destination.id,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });
  const visibleRows = table.getRowModel().rows;
  const isEmpty = visibleRows.length === 0;
  const pageCount = table.getPageCount();
  const pageIndex = table.getState().pagination.pageIndex;
  const pageStart =
    destinations.length === 0
      ? 0
      : Math.min(pageIndex * pagination.pageSize + 1, destinations.length);
  const pageEnd =
    destinations.length === 0
      ? 0
      : Math.max(pageStart, Math.min(destinations.length, pageStart + visibleRows.length - 1));

  return (
    <section className="bg-background flex min-h-0 flex-1 flex-col">
      <div
        className={cn(
          "border-border min-h-0 flex-1 overflow-auto border",
          isEmpty ? "[&>[data-slot=table-container]]:h-full" : null,
        )}
      >
        <Table className={cn("min-w-245 table-fixed", isEmpty ? "h-full" : null)}>
          <TableHeader className="bg-muted/60 sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-muted/60 hover:bg-muted/60">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn(
                      "text-muted-foreground h-8 px-3 text-center align-middle text-[11px] font-semibold tracking-wider uppercase",
                      destinationsColumnClassName(header.column.id),
                    )}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody className={isEmpty ? "h-full" : undefined}>
            {isEmpty ? (
              <TableRow className="h-full hover:bg-transparent">
                <TableCell
                  className="h-full p-0 align-middle"
                  colSpan={table.getAllColumns().length}
                >
                  <DestinationsEmptyState />
                </TableCell>
              </TableRow>
            ) : (
              visibleRows.map((row) => (
                <TableRow key={row.id} className="hover:bg-muted/50">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        "h-16 px-3 py-3 align-middle",
                        destinationsColumnClassName(cell.column.id),
                        cell.column.id === "destination" ? "text-left" : "text-center",
                      )}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <DashboardTablePagination
        rangeLabel={
          destinations.length > 0
            ? t("destinations.table.pagination.range", {
                start: pageStart,
                end: pageEnd,
                total: destinations.length,
              })
            : t("destinations.table.pagination.empty")
        }
        pageLabel={t("destinations.table.pagination.page", {
          page: Math.min(pageIndex + 1, Math.max(pageCount, 1)),
          pageCount: Math.max(pageCount, 1),
        })}
        previousLabel={t("destinations.table.pagination.previous")}
        nextLabel={t("destinations.table.pagination.next")}
        pageIndex={pageIndex}
        pageCount={pageCount}
        onPageIndexChange={(nextPageIndex) => table.setPageIndex(nextPageIndex)}
      />
    </section>
  );
}

function destinationsColumnClassName(columnId: string): string | null {
  switch (columnId) {
    case "destination":
      return "w-[25%]";
    case "kind":
      return "w-[13%]";
    case "safeConfiguration":
      return "w-[27%]";
    case "state":
      return "w-[11%]";
    case "actions":
      return "w-[24%]";
    default:
      return null;
  }
}

const destinationsPageSize = 10;
