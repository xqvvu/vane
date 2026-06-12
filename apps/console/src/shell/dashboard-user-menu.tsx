import "@tanstack/react-start/client-only";
import { RiLogoutCircleLine, RiUser3Line } from "@remixicon/react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import * as React from "react";

import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar.tsx";
import { Button } from "#/components/ui/button.tsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu.tsx";
import { authQueryKeys, dashboardSessionQueryOptions } from "#/features/auth/api/auth.queries.ts";
import { authClient } from "#/lib/auth.client.ts";

export interface DashboardUserMenuProps {
  user: {
    name: string | null;
    email: string;
    image: string | null;
    role: string | null;
  };
}

export function DashboardUserMenu({ user }: DashboardUserMenuProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [pending, setPending] = React.useState(false);

  async function signOut() {
    setPending(true);

    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: async () => {
            queryClient.setQueryData(dashboardSessionQueryOptions().queryKey, null);
            await queryClient.invalidateQueries({
              queryKey: authQueryKeys.all,
            });
            await navigate({
              to: "/login",
              search: {
                redirect: "/",
              },
              replace: true,
            });
          },
        },
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="rounded-full"
            aria-label="Open profile menu"
          />
        }
      >
        <UserAvatar user={user} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <div className="flex min-w-0 items-center gap-2">
              <UserAvatar user={user} />
              <div className="min-w-0">
                <div className="text-foreground truncate font-medium">
                  {user.name ?? user.email}
                </div>
                <div className="truncate">{user.email}</div>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuItem disabled>
            <RiUser3Line aria-hidden />
            {user.role ?? "member"}
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem disabled={pending} onClick={() => void signOut()}>
            <RiLogoutCircleLine aria-hidden />
            {pending ? "Signing out" : "Sign out"}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function UserAvatar({ user }: Pick<DashboardUserMenuProps, "user">) {
  return (
    <Avatar size="sm">
      {user.image ? <AvatarImage src={user.image} alt={user.name ?? user.email} /> : null}
      <AvatarFallback>{userInitial(user)}</AvatarFallback>
    </Avatar>
  );
}

function userInitial(user: DashboardUserMenuProps["user"]): string {
  const label = user.name || user.email;
  return label.trim().charAt(0).toUpperCase() || "U";
}
