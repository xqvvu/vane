import { RiEditLine, RiRouteLine, RiShutDownLine } from "@remixicon/react";

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
import { ConfigurationStateBadge } from "#/features/configuration/ui/configuration-state-badge.tsx";
import { describeRule } from "#/features/routes/model/route-rule-summary.ts";
import { EditRouteForm } from "#/features/routes/ui/route-forms.tsx";
import { DashboardPanel } from "#/shell/dashboard-panel.tsx";
import { DashboardTable } from "#/shell/dashboard-table.tsx";

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
  return (
    <DashboardPanel
      title="Routes"
      icon={<RiRouteLine className="size-4" aria-hidden />}
      action={<span className="text-muted-foreground text-xs">{routes.length} configured</span>}
    >
      <DashboardTable
        empty={<RoutesEmptyState hasDestinations={destinations.length > 0} />}
        headers={["Name", "Rule", "Destinations", "State", ""]}
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
            <ConfigurationStateBadge key="state" enabled={route.enabled} />,
            <div key="actions" className="flex justify-end gap-1">
              <Button
                variant="outline"
                size="icon-xs"
                disabled={pending}
                title="Edit route"
                onClick={() => onEdit(route.id)}
              >
                <RiEditLine data-icon="inline-start" aria-hidden />
              </Button>
              <Button
                variant="outline"
                size="xs"
                disabled={pending}
                title={route.enabled ? "Disable route matching" : "Enable route matching"}
                onClick={() => onToggle(route)}
              >
                <RiShutDownLine data-icon="inline-start" aria-hidden />
                {route.enabled ? "Disable" : "Enable"}
              </Button>
            </div>,
          ],
        }))}
      />
      {editingRoute ? (
        <EditRouteForm
          key={editingRoute.id}
          route={editingRoute}
          sources={sources}
          destinations={destinations}
          pending={pending}
          onCancel={onCancelEdit}
          onSubmit={onSubmitEdit}
        />
      ) : null}
    </DashboardPanel>
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
  const chips = routeRuleChips(route.rule, sources);

  if (chips.length === 0) {
    return <span className="text-muted-foreground text-xs italic">All events</span>;
  }

  return (
    <div className="flex min-w-0 flex-wrap gap-1" title={describeRule(route.rule)}>
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
  const names = destinationIds.map((id) => {
    return destinations.find((destination) => destination.id === id)?.name ?? id;
  });

  return (
    <div className="min-w-0">
      <div className="font-medium">{destinationIds.length}</div>
      <div className="text-muted-foreground mt-0.5 truncate text-[11px]" title={names.join(", ")}>
        {names.length > 0 ? names.join(", ") : "No destinations"}
      </div>
    </div>
  );
}

function RoutesEmptyState({ hasDestinations }: { hasDestinations: boolean }) {
  return (
    <Empty className="border-none p-4">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <RiRouteLine aria-hidden />
        </EmptyMedia>
        <EmptyTitle>No routes configured</EmptyTitle>
        <EmptyDescription>
          Create a route to match normalized events and send them to one or more destinations.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        {hasDestinations
          ? "New route setup stays available in the right rail."
          : "Create at least one destination before enabling a route."}
      </EmptyContent>
    </Empty>
  );
}

function routeRuleChips(rule: RouteSummary["rule"], sources: Configuration["sources"]): string[] {
  return [
    ...rule.sourceIds.map((sourceId) => `source:${sourceNameForId(sourceId, sources)}`),
    ...rule.severities.map((severity) => `severity:${severity}`),
    ...rule.statuses.map((status) => `status:${status}`),
    ...rule.labels.map(
      (label) => `${label.key}${label.operator === "equals" ? "=" : "~"}${label.value}`,
    ),
    ...rule.titleContains.map((value) => `title:${value}`),
    ...rule.messageContains.map((value) => `message:${value}`),
  ];
}

function sourceNameForId(sourceId: string, sources: Configuration["sources"]): string {
  return sources.find((source) => source.id === sourceId)?.name ?? sourceId.slice(0, 10);
}
