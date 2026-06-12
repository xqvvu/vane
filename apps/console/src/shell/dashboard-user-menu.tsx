import "@tanstack/react-start/client-only";
import { RiLogoutCircleLine, RiUser3Line } from "@remixicon/react";
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
