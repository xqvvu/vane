import "@tanstack/react-start/client-only";
import { RiLogoutCircleLine } from "@remixicon/react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { authQueryKeys, dashboardSessionQueryOptions } from "#/features/auth/api/auth.queries";
import { LanguageMenuGroupClient } from "#/i18n/language-switcher-impl";
import { useTranslations } from "#/i18n/use-i18n";
import { authClient } from "#/lib/auth.client";
import type { DashboardUserMenuProps } from "#/shell/dashboard-user-menu";

export function DashboardUserMenuClient({ user }: DashboardUserMenuProps) {
  const t = useTranslations();
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
            toast.success(t("shell.userMenu.signedOutTitle"), {
              description: t("shell.userMenu.signedOutDescription"),
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
    } catch (caught) {
      toast.error(t("shell.userMenu.signOutFailureTitle"), {
        description: caught instanceof Error ? caught.message : String(caught),
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
            aria-label={t("shell.userMenu.open")}
          />
        }
      >
        <UserAvatar fallbackInitial={t("shell.userMenu.fallbackInitial")} user={user} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <div className="flex min-w-0 items-center gap-2">
              <UserAvatar fallbackInitial={t("shell.userMenu.fallbackInitial")} user={user} />
              <div className="min-w-0">
                <div className="flex min-w-0 items-center gap-1.5">
                  <div className="text-foreground min-w-0 truncate font-medium">
                    {user.name ?? user.email}
                  </div>
                  <Badge
                    variant="outline"
                    className="text-muted-foreground flex h-4 shrink-0 items-center px-1.5 py-0 font-mono text-[10px]"
                  >
                    {user.role ?? t("shell.userMenu.defaultRole")}
                  </Badge>
                </div>
                <div className="truncate">{user.email}</div>
              </div>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <LanguageMenuGroupClient />
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem disabled={pending} onClick={() => void signOut()}>
            <RiLogoutCircleLine aria-hidden />
            {pending ? t("shell.userMenu.signingOut") : t("shell.userMenu.signOut")}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function UserAvatar({
  fallbackInitial,
  user,
}: Pick<DashboardUserMenuProps, "user"> & { fallbackInitial: string }) {
  return (
    <Avatar size="sm">
      {user.image ? <AvatarImage src={user.image} alt={user.name ?? user.email} /> : null}
      <AvatarFallback>{userInitial(user, fallbackInitial)}</AvatarFallback>
    </Avatar>
  );
}

function userInitial(user: DashboardUserMenuProps["user"], fallbackInitial: string): string {
  const label = user.name || user.email;
  return label.trim().charAt(0).toUpperCase() || fallbackInitial;
}
