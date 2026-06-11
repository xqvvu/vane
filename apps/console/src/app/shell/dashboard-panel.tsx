import type { ReactNode } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card.tsx";

export interface DashboardPanelProps {
  title: string;
  icon: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}

export function DashboardPanel({ title, icon, action, children }: DashboardPanelProps) {
  return (
    <section className="border-border bg-card border">
      <div className="border-border flex items-center justify-between border-b px-3 py-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          {icon}
          {title}
        </h2>
        {action}
      </div>
      <div className="p-3">{children}</div>
    </section>
  );
}

export interface DashboardFormPanelProps {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}

export function DashboardFormPanel({ title, icon, children }: DashboardFormPanelProps) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
