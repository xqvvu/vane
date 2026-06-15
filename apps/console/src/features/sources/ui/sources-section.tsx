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
import type { Configuration } from "#/features/configuration/model/configuration-types.ts";
import { ConfigurationStateBadge } from "#/features/configuration/ui/configuration-state-badge.tsx";
import { sourceRouteCoverage } from "#/features/sources/model/source-route-coverage.ts";
import { SourceActions } from "#/features/sources/ui/source-actions.tsx";
import { SourceIdentityCell } from "#/features/sources/ui/source-identity-cell.tsx";
import { SourceRouteCoverageCell } from "#/features/sources/ui/source-route-coverage-cell.tsx";
import type { SourceSummary } from "#/features/sources/ui/source-ui-types.ts";
import { SourceWebhookCell } from "#/features/sources/ui/source-webhook-cell.tsx";
import { SourcesEmptyState } from "#/features/sources/ui/sources-empty-state.tsx";
import { useTranslations } from "#/i18n/use-i18n.ts";
import { cn } from "#/lib/utils.ts";
import { DashboardTablePagination } from "#/shell/dashboard-table-pagination.tsx";

export interface SourcesSectionProps {
  sources: Configuration["sources"];
  routes: Configuration["routes"];
  pending: boolean;
  onEdit: (sourceId: string) => void;
  onToggle: (source: SourceSummary) => void;
  onRotateToken: (source: SourceSummary) => void;
}

export function SourcesSection({
  sources,
  routes,
  pending,
  onEdit,
  onToggle,
  onRotateToken,
}: SourcesSectionProps) {
  const t = useTranslations();
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: sourcesPageSize,
  });
  const data = React.useMemo(() => sources, [sources]);
  const columns = React.useMemo<Array<ColumnDef<SourceSummary>>>(
    () => [
      {
        id: "source",
        header: t("sources.table.headers.source"),
        cell: ({ row }) => <SourceIdentityCell source={row.original} />,
      },
      {
        id: "webhook",
        header: t("sources.table.headers.intake"),
        cell: ({ row }) => <SourceWebhookCell sourceId={row.original.id} />,
      },
      {
        id: "routes",
        header: t("sources.table.headers.routes"),
        cell: ({ row }) => (
          <SourceRouteCoverageCell coverage={sourceRouteCoverage(row.original.id, routes)} />
        ),
      },
      {
        id: "status",
        header: t("sources.table.headers.status"),
        cell: ({ row }) => <ConfigurationStateBadge enabled={row.original.enabled} />,
      },
      {
        id: "actions",
        header: t("sources.table.headers.actions"),
        cell: ({ row }) => (
          <SourceActions
            source={row.original}
            pending={pending}
            onEdit={onEdit}
            onToggle={onToggle}
            onRotateToken={onRotateToken}
          />
        ),
      },
    ],
    [onEdit, onRotateToken, onToggle, pending, routes, t],
  );
  React.useEffect(() => {
    setPagination((current) => {
      const nextPageCount = Math.max(Math.ceil(sources.length / current.pageSize), 1);

      if (current.pageIndex < nextPageCount) {
        return current;
      }

      return {
        ...current,
        pageIndex: nextPageCount - 1,
      };
    });
  }, [sources.length]);

  const table = useReactTable({
    data,
    columns,
    state: {
      pagination,
    },
    onPaginationChange: setPagination,
    getRowId: (source) => source.id,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });
  const visibleRows = table.getRowModel().rows;
  const isEmpty = visibleRows.length === 0;
  const pageCount = table.getPageCount();
  const pageIndex = table.getState().pagination.pageIndex;
  const pageStart =
    sources.length === 0 ? 0 : Math.min(pageIndex * pagination.pageSize + 1, sources.length);
  const pageEnd =
    sources.length === 0
      ? 0
      : Math.max(pageStart, Math.min(sources.length, pageStart + visibleRows.length - 1));

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
                      sourcesColumnClassName(header.column.id),
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
                  <SourcesEmptyState />
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
                        sourcesColumnClassName(cell.column.id),
                        cell.column.id === "source" ? "text-left" : "text-center",
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
          sources.length > 0
            ? t("sources.table.pagination.range", {
                start: pageStart,
                end: pageEnd,
                total: sources.length,
              })
            : t("sources.table.pagination.empty")
        }
        pageLabel={t("sources.table.pagination.page", {
          page: Math.min(pageIndex + 1, Math.max(pageCount, 1)),
          pageCount: Math.max(pageCount, 1),
        })}
        previousLabel={t("sources.table.pagination.previous")}
        nextLabel={t("sources.table.pagination.next")}
        pageIndex={pageIndex}
        pageCount={pageCount}
        onPageIndexChange={(nextPageIndex) => table.setPageIndex(nextPageIndex)}
      />
    </section>
  );
}

function sourcesColumnClassName(columnId: string): string | null {
  switch (columnId) {
    case "source":
      return "w-[30%]";
    case "webhook":
      return "w-[30%]";
    case "routes":
      return "w-[13%]";
    case "status":
      return "w-[11%]";
    case "actions":
      return "w-[16%]";
    default:
      return null;
  }
}

const sourcesPageSize = 10;
