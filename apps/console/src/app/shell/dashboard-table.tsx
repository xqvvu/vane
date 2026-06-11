import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table";
import * as React from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "#/components/ui/table.tsx";

export interface DashboardTableProps {
  headers: string[];
  rows: Array<{ key: string; cells: React.ReactNode[] }>;
  empty: string;
}

export function DashboardTable({ headers, rows, empty }: DashboardTableProps) {
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
          <TableRow key={headerGroup.id} className="hover:bg-transparent">
            {headerGroup.headers.map((header) => (
              <TableHead key={header.id} className="text-muted-foreground h-8">
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
              className="text-muted-foreground py-6 text-center"
              colSpan={table.getAllColumns().length}
            >
              {empty}
            </TableCell>
          </TableRow>
        ) : (
          table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id} className="truncate">
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
