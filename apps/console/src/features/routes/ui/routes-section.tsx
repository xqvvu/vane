import { RiEditLine, RiRouteLine, RiShutDownLine } from "@remixicon/react";

import { EnabledStateBadge } from "#/components/common/enabled-state-badge.tsx";
import { SimpleTable } from "#/components/common/simple-table.tsx";
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
import type { Configuration } from "#/features/configuration/model/configuration-types.ts";
import { EditRouteForm } from "#/features/routes/ui/route-forms.tsx";
import { useTranslations } from "#/i18n/use-i18n.ts";

type RouteSummary = Configuration["routes"][number];
type DestinationSummary = Configuration["destinations"][number];

export interface RoutesSectionProps {
  routes: Configuration["routes"];
  sources: Configuration["sources"];
  destinations: Configuration["destinations"];
  editingRoute: RouteSummary | null;
  pending: boolean;
  onEdit: (routeId: string) => void;
  onCancelEdit: () => void;
  onToggle: (route: RouteSummary) => void;
  onSubmitEdit: (input: {
    id: string;
    name: string;
    rule: RouteSummary["rule"];
    destinationIds: string[];
  }) => void;
}

export function RoutesSection({
  routes,
  sources,
  destinations,
  editingRoute,
  pending,
  onEdit,
  onCancelEdit,
  onToggle,
  onSubmitEdit,
}: RoutesSectionProps) {
  const t = useTranslations();

  return (
    <section className="bg-background">
      <SimpleTable
        variant="flush"
        empty={<RoutesEmptyState hasDestinations={destinations.length > 0} />}
        headers={[
          t("routing.table.headers.name"),
          t("routing.table.headers.rule"),
          t("routing.table.headers.destinations"),
          t("routing.table.headers.state"),
          t("routing.table.headers.actions"),
        ]}
        columnClassNames={["w-[22%]", "w-[34%]", "w-[20%]", "w-[10%]", "w-[14%]"]}
        rows={routes.map((route) => ({
          key: route.id,
          cells: [
            <RouteIdentityCell key="identity" route={route} />,
            <RouteRuleCell key="rule" route={route} sources={sources} />,
            <RouteDestinationsCell
              key="destinations"
              destinationIds={route.destinationIds}
              destinations={destinations}
            />,
            <EnabledStateBadge key="state" enabled={route.enabled} />,
            <div key="actions" className="flex justify-end gap-1">
              <Button
                variant="outline"
                size="icon-xs"
                disabled={pending}
                title={t("routing.table.actions.edit")}
                onClick={() => onEdit(route.id)}
              >
                <RiEditLine data-icon="inline-start" aria-hidden />
              </Button>
              <Button
                variant="outline"
                size="xs"
                disabled={pending}
                title={
                  route.enabled
                    ? t("routing.table.actions.disableTitle")
                    : t("routing.table.actions.enableTitle")
                }
                onClick={() => onToggle(route)}
              >
                <RiShutDownLine data-icon="inline-start" aria-hidden />
                {route.enabled
                  ? t("routing.table.actions.disable")
                  : t("routing.table.actions.enable")}
              </Button>
            </div>,
          ],
        }))}
      />
      {routes.length > 0 ? (
        <div className="border-border bg-background border-t py-4 text-center">
          <span className="text-muted-foreground text-[11px] font-bold tracking-[0.18em] uppercase">
            {t("routing.table.end")}
          </span>
        </div>
      ) : null}
      {editingRoute ? (
        <div className="border-border border-t p-3">
          <EditRouteForm
            key={editingRoute.id}
            route={editingRoute}
            sources={sources}
            destinations={destinations}
            pending={pending}
            onCancel={onCancelEdit}
            onSubmit={onSubmitEdit}
          />
        </div>
      ) : null}
    </section>
  );
}

function RouteIdentityCell({ route }: { route: RouteSummary }) {
  return (
    <div className="min-w-0">
      <div className="truncate font-medium" title={route.name}>
        {route.name}
      </div>
      <div className="text-muted-foreground mt-0.5 truncate font-mono text-[11px]" title={route.id}>
        {route.id.slice(0, 12)}
      </div>
    </div>
  );
}

function RouteRuleCell({
  route,
  sources,
}: {
  route: RouteSummary;
  sources: Configuration["sources"];
}) {
  const t = useTranslations();
  const chips = routeRuleChips(route.rule, sources, t);

  if (chips.length === 0) {
    return (
      <span className="text-muted-foreground text-xs italic">{t("routing.table.allEvents")}</span>
    );
  }

  return (
    <div className="flex min-w-0 flex-wrap gap-1" title={describeRuleForUi(route.rule, t)}>
      {chips.map((chip) => (
        <Badge key={chip} variant="outline" className="max-w-full truncate font-mono text-[11px]">
          {chip}
        </Badge>
      ))}
    </div>
  );
}

function RouteDestinationsCell({
  destinationIds,
  destinations,
}: {
  destinationIds: string[];
  destinations: DestinationSummary[];
}) {
  const t = useTranslations();
  const names = destinationIds.map((id) => {
    return destinations.find((destination) => destination.id === id)?.name ?? id;
  });

  return (
    <div className="min-w-0">
      <div className="font-medium">{destinationIds.length}</div>
      <div className="text-muted-foreground mt-0.5 truncate text-[11px]" title={names.join(", ")}>
        {names.length > 0 ? names.join(", ") : t("routing.table.noDestinations")}
      </div>
    </div>
  );
}

function RoutesEmptyState({ hasDestinations }: { hasDestinations: boolean }) {
  const t = useTranslations();

  return (
    <Empty className="border-none p-4">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <RiRouteLine aria-hidden />
        </EmptyMedia>
        <EmptyTitle>{t("routing.table.empty.title")}</EmptyTitle>
        <EmptyDescription>{t("routing.table.empty.description")}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        {hasDestinations
          ? t("routing.table.empty.withDestinations")
          : t("routing.table.empty.withoutDestinations")}
      </EmptyContent>
    </Empty>
  );
}

function routeRuleChips(
  rule: RouteSummary["rule"],
  sources: Configuration["sources"],
  t: ReturnType<typeof useTranslations>,
): string[] {
  return [
    ...rule.sourceIds.map(
      (sourceId) => `${t("routing.table.rulePrefix.source")}:${sourceNameForId(sourceId, sources)}`,
    ),
    ...rule.severities.map((severity) => `${t("routing.table.rulePrefix.severity")}:${severity}`),
    ...rule.statuses.map((status) => `${t("routing.table.rulePrefix.status")}:${status}`),
    ...rule.labels.map(
      (label) => `${label.key}${label.operator === "equals" ? "=" : "~"}${label.value}`,
    ),
    ...rule.titleContains.map((value) => `${t("routing.table.rulePrefix.title")}:${value}`),
    ...rule.messageContains.map((value) => `${t("routing.table.rulePrefix.message")}:${value}`),
  ];
}

function describeRuleForUi(
  rule: RouteSummary["rule"],
  t: ReturnType<typeof useTranslations>,
): string {
  const labels = rule.labels.map(
    (label) => `${label.key}${label.operator === "equals" ? "=" : "~"}${label.value}`,
  );
  const parts = [
    rule.sourceIds.length > 0
      ? `${t("routing.table.rulePrefix.sources")}:${rule.sourceIds.length}`
      : null,
    rule.severities.length > 0
      ? `${t("routing.table.rulePrefix.severity")}:${rule.severities.join(",")}`
      : null,
    rule.statuses.length > 0
      ? `${t("routing.table.rulePrefix.status")}:${rule.statuses.join(",")}`
      : null,
    labels.length > 0 ? `${t("routing.table.rulePrefix.labels")}:${labels.join(",")}` : null,
    rule.titleContains.length > 0
      ? `${t("routing.table.rulePrefix.title")}:${rule.titleContains.join(",")}`
      : null,
    rule.messageContains.length > 0
      ? `${t("routing.table.rulePrefix.message")}:${rule.messageContains.join(",")}`
      : null,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" · ") : t("routing.table.allEvents");
}

function sourceNameForId(sourceId: string, sources: Configuration["sources"]): string {
  return sources.find((source) => source.id === sourceId)?.name ?? sourceId.slice(0, 10);
}
