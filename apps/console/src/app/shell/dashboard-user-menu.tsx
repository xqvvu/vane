import "@tanstack/react-start/client-only";
import { RiLogoutCircleLine, RiUser3Line } from "@remixicon/react";
import { useNavigate } from "@tanstack/react-router";
import * as React from "react";

import { Button } from "#/components/ui/button.tsx";
import { authClient } from "#/lib/auth.client.ts";

export interface DashboardUserMenuProps {
  user: {
    email: string;
    role: string | null;
  };
}

export function DashboardUserMenu({ user }: DashboardUserMenuProps) {
  const navigate = useNavigate();
  const [pending, setPending] = React.useState(false);

  async function signOut() {
    setPending(true);

    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            void navigate({
              to: "/login",
              search: {
                redirect: "/",
              },
            });
          },
        },
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-w-0 items-center gap-2">
      <div className="hidden min-w-0 text-right text-xs sm:block">
        <div className="truncate font-medium">{user.email}</div>
        <div className="text-muted-foreground flex items-center justify-end gap-1">
          <RiUser3Line className="size-3" aria-hidden />
          {user.role ?? "member"}
        </div>
      </div>
      <Button type="button" variant="outline" size="sm" disabled={pending} onClick={signOut}>
        <RiLogoutCircleLine aria-hidden />
        Sign out
      </Button>
    </div>
  );
}
