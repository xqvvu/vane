import {
  RiDashboardLine,
  RiEditLine,
  RiFileCopyLine,
  RiGlobalLine,
  RiKey2Line,
  RiLockLine,
  RiNodeTree,
  RiPulseLine,
  RiServerLine,
  RiShutDownLine,
  RiWebhookLine,
} from "@remixicon/react";
import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table";
import * as React from "react";

import { Badge } from "#/components/ui/badge.tsx";
import { Button } from "#/components/ui/button.tsx";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "#/components/ui/empty.tsx";
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
import { sourceWebhookUrl } from "#/features/sources/model/source-webhook.ts";
import { EditSourceForm } from "#/features/sources/ui/source-forms.tsx";
import { SourceWebhookCell } from "#/features/sources/ui/source-webhook-cell.tsx";
import { useTranslations } from "#/i18n/use-i18n.ts";
import { copyText } from "#/lib/browser.ts";
import { cn } from "#/lib/utils.ts";

type SourceSummary = Configuration["sources"][number];

export interface SourcesSectionProps {
  sources: Configuration["sources"];
  editingSource: Configuration["sources"][number] | null;
  pending: boolean;
  onEdit: (sourceId: string) => void;
  onCancelEdit: () => void;
  onToggle: (source: SourceSummary) => void;
  onRotateToken: (source: SourceSummary) => void;
  onSubmitEdit: (input: {
    id: string;
    name: string;
    provider: SourceSummary["provider"];
    config?: import("@vane/core").JsonObject;
  }) => void;
}

export function SourcesSection({
  sources,
  editingSource,
  pending,
  onEdit,
  onCancelEdit,
  onToggle,
  onRotateToken,
  onSubmitEdit,
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
      {editingSource ? (
        <div className="border-border border-t p-3">
          <EditSourceForm
            key={editingSource.id}
            source={editingSource}
            pending={pending}
            onCancel={onCancelEdit}
            onSubmit={onSubmitEdit}
          />
        </div>
      ) : null}
    </section>
  );
}

function SourceIdentityCell({ source }: { source: SourceSummary }) {
  const t = useTranslations();
  const Icon = sourceProviderIcon(source.provider);

  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="border-border bg-muted/70 flex size-8 shrink-0 items-center justify-center border">
        <Icon className="text-muted-foreground size-4" aria-hidden />
      </div>
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold" title={source.name}>
          {source.name}
        </div>
        <div className="text-muted-foreground mt-0.5 flex min-w-0 items-center gap-1.5 text-[11px] font-medium uppercase">
          <span>{t(source.provider)}</span>
          <span aria-hidden>|</span>
          <span className="truncate font-mono lowercase" title={source.id}>
            {source.id.slice(0, 12)}
          </span>
        </div>
      </div>
    </div>
  );
}

function SourceAuthCell() {
  const t = useTranslations();

  return (
    <div className="min-w-0">
      <Badge variant="outline" className="bg-muted/40 text-[11px] font-semibold">
        <RiLockLine data-icon="inline-start" aria-hidden />
        {t("sources.table.tokenConfigured")}
      </Badge>
    </div>
  );
}

function SourceActions({
  source,
  pending,
  onEdit,
  onToggle,
  onRotateToken,
}: {
  source: SourceSummary;
  pending: boolean;
  onEdit: (sourceId: string) => void;
  onToggle: (source: SourceSummary) => void;
  onRotateToken: (source: SourceSummary) => void;
}) {
  const t = useTranslations();

  return (
    <div className="flex justify-end gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        disabled={pending}
        title={t("sources.table.actions.copyWebhookUrl")}
        onClick={() => void copyText(sourceWebhookUrl(source.id))}
      >
        <RiFileCopyLine data-icon="inline-start" aria-hidden />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        disabled={pending}
        title={t("sources.table.actions.edit")}
        onClick={() => onEdit(source.id)}
      >
        <RiEditLine data-icon="inline-start" aria-hidden />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        disabled={pending}
        title={t("sources.table.actions.rotateToken")}
        onClick={() => onRotateToken(source)}
      >
        <RiKey2Line data-icon="inline-start" aria-hidden />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        disabled={pending}
        title={
          source.enabled ? t("sources.table.actions.disable") : t("sources.table.actions.enable")
        }
        onClick={() => onToggle(source)}
      >
        <RiShutDownLine data-icon="inline-start" aria-hidden />
      </Button>
    </div>
  );
}

function SourcesEmptyState() {
  const t = useTranslations();

  return (
    <Empty className="border-none p-4">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <RiWebhookLine aria-hidden />
        </EmptyMedia>
        <EmptyTitle>{t("sources.table.empty.title")}</EmptyTitle>
        <EmptyDescription>{t("sources.table.empty.description")}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>{t("sources.table.empty.content")}</EmptyContent>
    </Empty>
  );
}

function sourceProviderIcon(provider: SourceSummary["provider"]) {
  switch (provider) {
    case "alertmanager":
      return RiServerLine;
    case "grafana":
      return RiPulseLine;
    case "signoz":
      return RiNodeTree;
    case "uptime_kuma":
      return RiGlobalLine;
    case "generic":
      return RiDashboardLine;
  }
}
