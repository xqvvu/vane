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
import type { Configuration } from "#/features/configuration/model/configuration-types.ts";
import { ConfigurationStateBadge } from "#/features/configuration/ui/configuration-state-badge.tsx";
import { SourceActions } from "#/features/sources/ui/source-actions.tsx";
import { SourceAuthCell } from "#/features/sources/ui/source-auth-cell.tsx";
import { SourceIdentityCell } from "#/features/sources/ui/source-identity-cell.tsx";
import type { SourceSummary } from "#/features/sources/ui/source-ui-types.ts";
import { SourceWebhookCell } from "#/features/sources/ui/source-webhook-cell.tsx";
import { SourcesEmptyState } from "#/features/sources/ui/sources-empty-state.tsx";
import { useTranslations } from "#/i18n/use-i18n.ts";
import { cn } from "#/lib/utils.ts";

export interface SourcesSectionProps {
  sources: Configuration["sources"];
  pending: boolean;
  onEdit: (sourceId: string) => void;
  onToggle: (source: SourceSummary) => void;
  onRotateToken: (source: SourceSummary) => void;
}

export function SourcesSection({
  sources,
  pending,
  onEdit,
  onToggle,
  onRotateToken,
}: SourcesSectionProps) {
  const t = useTranslations();
  const columns = React.useMemo<Array<ColumnDef<SourceSummary>>>(
    () => [
      {
        id: "source",
        header: t("sources.table.headers.source"),
        cell: ({ row }) => <SourceIdentityCell source={row.original} />,
      },
      {
        id: "webhook",
        header: t("sources.table.headers.webhook"),
        cell: ({ row }) => <SourceWebhookCell sourceId={row.original.id} compact />,
      },
      {
        id: "auth",
        header: t("sources.table.headers.auth"),
        cell: () => <SourceAuthCell />,
      },
      {
        id: "status",
        header: t("sources.table.headers.status"),
        cell: ({ row }) => <ConfigurationStateBadge enabled={row.original.enabled} />,
      },
      {
        id: "last-received",
        header: t("sources.table.headers.lastReceived"),
        cell: () => <span className="text-muted-foreground text-xs">--</span>,
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
    [onEdit, onRotateToken, onToggle, pending, t],
  );
  const table = useReactTable({
    data: sources,
    columns,
    getRowId: (source) => source.id,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <section className="bg-background">
      <Table className="table-fixed">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="bg-muted/60 hover:bg-muted/60">
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className={cn(
                    "text-muted-foreground h-8 px-3 text-[11px] font-semibold tracking-wider uppercase",
                    header.column.id === "source" ? "w-[28%]" : null,
                    header.column.id === "webhook" ? "w-[19%]" : null,
                    header.column.id === "auth" ? "w-[17%]" : null,
                    header.column.id === "status" ? "w-[11%]" : null,
                    header.column.id === "last-received" ? "w-[13%]" : null,
                    header.column.id === "actions" ? "w-[12%] text-right" : null,
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
              <TableCell className="py-8" colSpan={table.getAllColumns().length}>
                <SourcesEmptyState />
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} className="hover:bg-muted/50">
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={cn("px-3 py-3", cell.column.id === "actions" ? "text-right" : null)}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      {sources.length > 0 ? (
        <div className="border-border bg-background border-t py-4 text-center">
          <span className="text-muted-foreground text-[11px] font-bold tracking-[0.18em] uppercase">
            {t("sources.table.end")}
          </span>
        </div>
      ) : null}
    </section>
  );
}
