import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "#/components/ui/table.tsx";
import { DeliveryDetailSectionHeader } from "#/features/deliveries/ui/delivery-detail-section-header.tsx";
import type { DeliveryDetailData } from "#/features/deliveries/ui/delivery-detail-types.ts";
import { DeliveryAttemptStateBadge } from "#/features/deliveries/ui/delivery-state-badge.tsx";
import { summarizeResponseBody } from "#/features/operations/model/operation-format.ts";
import { OperationTimestamp } from "#/features/operations/ui/operation-timestamp.tsx";
import { useTranslations } from "#/i18n/use-i18n.ts";

export function DeliveryAttemptsTable({ attempts }: { attempts: DeliveryDetailData["attempts"] }) {
  const t = useTranslations();

  return (
    <section className="flex h-full min-h-0 flex-col gap-2">
      <DeliveryDetailSectionHeader
        title={t("deliveries.detail.attemptsTitle")}
        meta={t("deliveries.detail.summary.attempts", { count: attempts.length })}
      />
      <div className="border-border bg-background min-h-0 flex-1 overflow-auto border">
        <Table className="min-w-190 table-fixed">
          <TableHeader className="bg-muted/50 text-muted-foreground sticky top-0 z-10">
            <TableRow>
              <TableHead className="w-[9%]">
                {t("deliveries.detail.attemptHeaders.number")}
              </TableHead>
              <TableHead className="w-[14%]">
                {t("deliveries.detail.attemptHeaders.state")}
              </TableHead>
              <TableHead className="w-[11%]">
                {t("deliveries.detail.attemptHeaders.http")}
              </TableHead>
              <TableHead className="w-[18%]">
                {t("deliveries.detail.attemptHeaders.started")}
              </TableHead>
              <TableHead className="w-[18%]">
                {t("deliveries.detail.attemptHeaders.finished")}
              </TableHead>
              <TableHead>{t("deliveries.detail.attemptHeaders.errorResponse")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {attempts.length === 0 ? (
              <TableRow>
                <TableCell className="text-muted-foreground" colSpan={6}>
                  {t("deliveries.detail.empty.attempts")}
                </TableCell>
              </TableRow>
            ) : (
              attempts.map((attempt) => {
                const note = attempt.error ?? summarizeResponseBody(attempt.responseBody);

                return (
                  <TableRow key={attempt.id} className="align-top">
                    <TableCell className="font-medium">{attempt.attemptNumber}</TableCell>
                    <TableCell>
                      <DeliveryAttemptStateBadge state={attempt.state} />
                    </TableCell>
                    <TableCell>{attempt.responseStatus ?? "-"}</TableCell>
                    <TableCell className="truncate">
                      <OperationTimestamp format="dateTime" value={attempt.startedAt} />
                    </TableCell>
                    <TableCell className="truncate">
                      {attempt.finishedAt ? (
                        <OperationTimestamp format="dateTime" value={attempt.finishedAt} />
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="truncate" title={note === "-" ? undefined : note}>
                      {note}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
