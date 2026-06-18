import { Badge } from "#/components/ui/badge.tsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "#/components/ui/table.tsx";
import { EventDetailSectionHeader } from "#/features/events/ui/event-detail-section-header.tsx";
import type { EventDetailData } from "#/features/events/ui/event-detail-types.ts";
import { useTranslations } from "#/i18n/use-i18n.ts";

export function EventDetailRouteMatchesTable({
  matches,
  matchedRouteCount,
}: {
  matches: EventDetailData["routeMatches"];
  matchedRouteCount: number;
}) {
  const t = useTranslations();

  return (
    <section className="flex h-full min-h-0 flex-col gap-2">
      <EventDetailSectionHeader
        title={t("events.detail.routeMatchesTitle")}
        meta={t("events.detail.summary.routeMatches", {
          matched: matchedRouteCount,
          total: matches.length,
        })}
      />
      <div className="border-border bg-background min-h-0 flex-1 overflow-auto border">
        <Table className="min-w-180 table-fixed">
          <TableHeader className="bg-muted/50 text-muted-foreground sticky top-0 z-10">
            <TableRow>
              <TableHead className="w-[28%]">{t("events.detail.routeHeaders.route")}</TableHead>
              <TableHead className="w-[16%]">{t("events.detail.routeHeaders.result")}</TableHead>
              <TableHead className="w-[14%]">{t("events.detail.routeHeaders.targets")}</TableHead>
              <TableHead>{t("events.detail.routeHeaders.checks")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {matches.length === 0 ? (
              <TableRow>
                <TableCell className="text-muted-foreground" colSpan={4}>
                  {t("events.detail.empty.routes")}
                </TableCell>
              </TableRow>
            ) : (
              matches.map((match) => (
                <TableRow key={match.routeId} className="align-top">
                  <TableCell className="truncate font-medium" title={match.routeName}>
                    {match.routeName}
                  </TableCell>
                  <TableCell>
                    <MatchBadge matched={match.matched} />
                  </TableCell>
                  <TableCell>{match.destinationIds.length}</TableCell>
                  <TableCell className="whitespace-normal">
                    <div className="flex min-w-0 flex-wrap gap-1">
                      {match.checks.map((check) => (
                        <RouteCheckBadge
                          key={`${match.routeId}-${check.field}-${check.detail}`}
                          check={check}
                        />
                      ))}
                    </div>
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

function MatchBadge({ matched }: { matched: boolean }) {
  const t = useTranslations();

  return (
    <Badge variant={matched ? "secondary" : "destructive"}>
      {matched ? t("events.detail.match.matched") : t("events.detail.match.missed")}
    </Badge>
  );
}

function RouteCheckBadge({
  check,
}: {
  check: EventDetailData["routeMatches"][number]["checks"][number];
}) {
  const t = useTranslations();

  return (
    <Badge
      variant={check.matched ? "outline" : "destructive"}
      className="max-w-full justify-start"
      title={check.detail}
    >
      <span className="font-medium">{t(`events.detail.routeCheckFields.${check.field}`)}</span>
      <span className="text-muted-foreground truncate">{check.detail}</span>
    </Badge>
  );
}
