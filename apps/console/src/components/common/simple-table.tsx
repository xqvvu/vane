import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table";
import * as React from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "#/components/ui/table";
import { cn } from "#/lib/utils";

export interface SimpleTableProps {
  headers: string[];
  rows: Array<{ key: string; cells: React.ReactNode[] }>;
  empty: React.ReactNode;
  columnClassNames?: string[];
  variant?: "default" | "flush";
}

export function SimpleTable({
  headers,
  rows,
  empty,
  columnClassNames = [],
  variant = "default",
}: SimpleTableProps) {
  const columns = React.useMemo<Array<ColumnDef<(typeof rows)[number]>>>(
    () =>
      headers.map((header, index) => ({
        id: `${index}-${header}`,
        header,
        cell: ({ row }) => row.original.cells[index] ?? null,
      })),
    [headers],
  );
  const table = useReactTable({
    data: rows,
    columns,
    getRowId: (row) => row.key,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Table className="table-fixed">
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow
            key={headerGroup.id}
            className={
              variant === "flush" ? "bg-muted/60 hover:bg-muted/60" : "hover:bg-transparent"
            }
          >
            {headerGroup.headers.map((header, index) => (
              <TableHead
                key={header.id}
                className={cn(
                  "text-muted-foreground h-8",
                  variant === "flush"
                    ? "px-3 text-[11px] font-semibold tracking-wider uppercase"
                    : null,
                  columnClassNames[index],
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
      <TableBody>
        {table.getRowModel().rows.length === 0 ? (
          <TableRow>
            <TableCell
              className={cn(
                "text-muted-foreground text-center",
                variant === "flush" ? "py-8" : "py-6",
              )}
              colSpan={table.getAllColumns().length}
            >
              {empty}
            </TableCell>
          </TableRow>
        ) : (
          table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              className={variant === "flush" ? "hover:bg-muted/50" : undefined}
            >
              {row.getVisibleCells().map((cell, index) => (
                <TableCell
                  key={cell.id}
                  className={cn(
                    variant === "flush" ? "px-3 py-3" : "truncate",
                    columnClassNames[index],
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
  );
}
