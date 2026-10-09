import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "#/components/ui/table";
import { DeliveryDetailSectionHeader } from "#/features/deliveries/ui/delivery-detail-section-header";
import type { DeliveryDetailData } from "#/features/deliveries/ui/delivery-detail-types";
import { DeliveryPingStateBadge } from "#/features/deliveries/ui/delivery-state-badge";
import { OperationTimestamp } from "#/features/operations/ui/operation-timestamp";
import { useTranslations } from "#/i18n/use-i18n";

export function DeliveryPingsTable({ pings }: { pings: DeliveryDetailData["pings"] }) {
  const t = useTranslations();

  return (
    <section className="flex h-full min-h-0 flex-col gap-2">
      <DeliveryDetailSectionHeader
        title={t("deliveries.detail.pingsTitle")}
        meta={t("deliveries.detail.summary.pings", { count: pings.length })}
      />
      <div className="border-border bg-background min-h-0 flex-1 overflow-auto border">
        <Table className="min-w-190 table-fixed">
          <TableHeader className="bg-muted/50 text-muted-foreground sticky top-0 z-10">
            <TableRow>
              <TableHead className="w-[22%]">
                {t("deliveries.detail.pingHeaders.receiver")}
              </TableHead>
              <TableHead className="w-[12%]">{t("deliveries.detail.pingHeaders.state")}</TableHead>
              <TableHead className="w-[10%]">
                {t("deliveries.detail.pingHeaders.trigger")}
              </TableHead>
              <TableHead className="w-[10%]">
                {t("deliveries.detail.pingHeaders.attempts")}
              </TableHead>
              <TableHead className="w-[16%]">
                {t("deliveries.detail.pingHeaders.created")}
              </TableHead>
              <TableHead>{t("deliveries.detail.pingHeaders.error")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pings.length === 0 ? (
              <TableRow>
                <TableCell className="text-muted-foreground" colSpan={6}>
                  {t("deliveries.detail.pingsEmpty")}
                </TableCell>
              </TableRow>
            ) : (
              pings.map((ping) => (
                <TableRow key={ping.id}>
                  <TableCell className="truncate font-mono text-xs" title={ping.receiver}>
                    {ping.receiver}
                  </TableCell>
                  <TableCell>
                    <DeliveryPingStateBadge state={ping.state} />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {t(`deliveries.pingTrigger.${ping.trigger}`)}
                  </TableCell>
                  <TableCell className="text-xs">
                    {ping.attemptCount}/{ping.maxAttempts}
                  </TableCell>
                  <TableCell>
                    <OperationTimestamp format="dateTime" value={ping.createdAt} />
                  </TableCell>
                  <TableCell className="text-muted-foreground truncate text-xs">
                    {ping.lastError ?? t("common.placeholder.empty")}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
