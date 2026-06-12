import { createClientOnlyFn } from "@tanstack/react-start";
import * as React from "react";

import { Skeleton } from "#/components/ui/skeleton.tsx";

export interface DashboardUserMenuProps {
  user: {
    name: string | null;
    email: string;
    image: string | null;
    role: string | null;
  };
}

const DashboardUserMenuClient = React.lazy(
  createClientOnlyFn(async () => {
    const module = await import("#/shell/dashboard-user-menu-impl.tsx");

    return { default: module.DashboardUserMenuClient };
  }),
);

function DashboardUserMenuRoot(props: DashboardUserMenuProps) {
  return <DashboardUserMenuClient {...props} />;
}

function DashboardUserMenuSkeleton() {
  return <Skeleton className="size-7 rounded-full" aria-label="Loading profile menu" />;
}

export const DashboardUserMenu = Object.assign(DashboardUserMenuRoot, {
  Skeleton: DashboardUserMenuSkeleton,
});
