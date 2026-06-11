import { RiEditLine, RiRouteLine } from "@remixicon/react";

import { DashboardPanel } from "#/app/shell/dashboard-panel.tsx";
import { DashboardTable } from "#/app/shell/dashboard-table.tsx";
import { Button } from "#/components/ui/button.tsx";
import type { Configuration } from "#/features/configuration/model/configuration-types.ts";
import { ConfigurationStateBadge } from "#/features/configuration/ui/configuration-state-badge.tsx";
import { describeRule } from "#/features/routes/model/route-rule-summary.ts";
import { EditRouteForm } from "#/features/routes/ui/route-forms.tsx";

export interface RoutesSectionProps {
  routes: Configuration["routes"];
  sources: Configuration["sources"];
  destinations: Configuration["destinations"];
  editingRoute: Configuration["routes"][number] | null;
  pending: boolean;
  onEdit: (routeId: string) => void;
  onCancelEdit: () => void;
  onToggle: (route: Configuration["routes"][number]) => void;
  onSubmitEdit: (input: {
    id: string;
    name: string;
    rule: Configuration["routes"][number]["rule"];
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
        empty="No routes yet"
        headers={["Name", "Rule", "Destinations", "State", ""]}
        rows={routes.map((route) => ({
          key: route.id,
          cells: [
            route.name,
            describeRule(route.rule),
            route.destinationIds.length,
            <ConfigurationStateBadge key="state" enabled={route.enabled} />,
            <div key="actions" className="flex justify-end gap-1">
              <Button
                variant="outline"
                size="icon-xs"
                disabled={pending}
                title="Edit route"
                onClick={() => onEdit(route.id)}
              >
                <RiEditLine aria-hidden />
              </Button>
              <Button
                variant="outline"
                size="xs"
                disabled={pending}
                onClick={() => onToggle(route)}
              >
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
