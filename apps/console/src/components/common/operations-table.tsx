import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState,
} from "@tanstack/react-table";
import * as React from "react";

import { TablePagination } from "#/components/common/table-pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "#/components/ui/table";
import { cn } from "#/lib/utils";

export interface OperationsTableProps<TData> {
  data: TData[];
  columns: Array<ColumnDef<TData>>;
  pageSize: number;
  showPagination?: boolean;
  minWidthClassName?: string;
  emptyState: React.ReactNode;
  getRowId: (row: TData) => string;
  columnClassName: (columnId: string) => string | null;
  isPrimaryColumn?: (columnId: string) => boolean;
  rangeLabel: (range: { start: number; end: number; total: number }) => string;
  emptyRangeLabel: string;
  pageLabel: (page: { page: number; pageCount: number }) => string;
  previousLabel: string;
  nextLabel: string;
}

export function OperationsTable<TData>({
  data,
  columns,
  pageSize,
  showPagination = true,
  minWidthClassName = "min-w-245",
  emptyState,
  getRowId,
  columnClassName,
  isPrimaryColumn = (columnId) => columnId === "name",
  rangeLabel,
  emptyRangeLabel,
  pageLabel,
  previousLabel,
  nextLabel,
}: OperationsTableProps<TData>) {
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize,
  });

  React.useEffect(() => {
    if (!showPagination) {
      return;
    }

    setPagination((current) => {
      const nextPageCount = Math.max(Math.ceil(data.length / current.pageSize), 1);

      if (current.pageIndex < nextPageCount) {
        return current;
      }

      return {
        ...current,
        pageIndex: nextPageCount - 1,
      };
    });
  }, [data.length, showPagination]);

  const table = useReactTable({
    data,
    columns,
    ...(showPagination
      ? {
          state: {
            pagination,
          },
          onPaginationChange: setPagination,
          getPaginationRowModel: getPaginationRowModel(),
        }
      : {}),
    getRowId,
    getCoreRowModel: getCoreRowModel(),
  });
  const visibleRows = table.getRowModel().rows;
  const isEmpty = visibleRows.length === 0;
  const pageCount = showPagination ? table.getPageCount() : 1;
  const pageIndex = showPagination ? table.getState().pagination.pageIndex : 0;
  const pageStart =
    data.length === 0 ? 0 : Math.min(pageIndex * pagination.pageSize + 1, data.length);
  const pageEnd =
    data.length === 0
      ? 0
      : Math.max(pageStart, Math.min(data.length, pageStart + visibleRows.length - 1));

  return (
    <section className="bg-background flex min-h-0 flex-1 flex-col">
      <div
        className={cn(
          "border-border min-h-0 flex-1 overflow-auto border",
          isEmpty ? "[&>[data-slot=table-container]]:h-full" : null,
        )}
      >
        <Table className={cn(minWidthClassName, "table-fixed", isEmpty ? "h-full" : null)}>
          <TableHeader className="bg-muted/60 sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-muted/60 hover:bg-muted/60">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn(
                      "text-muted-foreground h-8 px-3 text-center align-middle text-[11px] font-semibold tracking-wider uppercase",
                      columnClassName(header.column.id),
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
                  {emptyState}
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
                        columnClassName(cell.column.id),
                        isPrimaryColumn(cell.column.id) ? "text-left" : "text-center",
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

      {showPagination ? (
        <TablePagination
          rangeLabel={
            data.length > 0
              ? rangeLabel({
                  start: pageStart,
                  end: pageEnd,
                  total: data.length,
                })
              : emptyRangeLabel
          }
          pageLabel={pageLabel({
            page: Math.min(pageIndex + 1, Math.max(pageCount, 1)),
            pageCount: Math.max(pageCount, 1),
          })}
          previousLabel={previousLabel}
          nextLabel={nextLabel}
          pageIndex={pageIndex}
          pageCount={pageCount}
          onPageIndexChange={(nextPageIndex) => table.setPageIndex(nextPageIndex)}
        />
      ) : null}
    </section>
  );
}
