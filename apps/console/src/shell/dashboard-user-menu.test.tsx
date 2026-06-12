// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { authQueryKeys, dashboardSessionQueryOptions } from "#/features/auth/api/auth.queries.ts";
import { DashboardUserMenu } from "#/shell/dashboard-user-menu.tsx";

const testState = vi.hoisted(() => ({
  navigate: vi.fn<() => Promise<void>>(async () => {}),
  authClient: {
    signOut: vi.fn<(input?: { fetchOptions?: { onSuccess?: () => void | Promise<void> } }) => void>(
      (input) => {
        void input?.fetchOptions?.onSuccess?.();
      },
    ),
  },
}));

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => testState.navigate,
}));

vi.mock("#/lib/auth.client.ts", () => ({
  authClient: testState.authClient,
}));

vi.mock("#/components/ui/avatar.tsx", () => ({
  Avatar: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  AvatarFallback: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  AvatarImage: ({ alt }: { alt?: string }) => <span>{alt}</span>,
}));

vi.mock("#/components/ui/button.tsx", () => ({
  Button: ({
    children,
    render,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    render?: React.ReactElement<React.ButtonHTMLAttributes<HTMLButtonElement>>;
  }) =>
    render ? (
      <button {...render.props} {...props}>
        {children}
      </button>
    ) : (
      <button {...props}>{children}</button>
    ),
}));

vi.mock("#/components/ui/dropdown-menu.tsx", () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuGroup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({
    children,
    disabled,
    onClick,
  }: {
    children: React.ReactNode;
    disabled?: boolean;
    onClick?: () => void;
  }) => (
    <button type="button" disabled={disabled} onClick={onClick}>
      {children}
    </button>
  ),
  DropdownMenuLabel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuSeparator: () => <hr />,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe("dashboard user menu", () => {
  afterEach(() => {
    cleanup();
    testState.navigate.mockClear();
    testState.authClient.signOut.mockClear();
  });

  it("clears cached auth state and navigates to login after sign out", async () => {
    const queryClient = new QueryClient();
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
    const session = {
      user: {
        id: "user-1",
        name: "Vane Owner",
        email: "owner@example.test",
        image: null,
        role: "owner",
      },
    };

    queryClient.setQueryData(dashboardSessionQueryOptions().queryKey, session);

    render(
      <QueryClientProvider client={queryClient}>
        <DashboardUserMenu user={session.user} />
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    await vi.waitFor(() => {
      expect(testState.authClient.signOut).toHaveBeenCalledOnce();
      expect(queryClient.getQueryData(dashboardSessionQueryOptions().queryKey)).toBeNull();
      expect(invalidateQueries).toHaveBeenCalledWith({
        queryKey: authQueryKeys.all,
      });
      expect(testState.navigate).toHaveBeenCalledWith({
        to: "/login",
        search: {
          redirect: "/",
        },
        replace: true,
      });
    });
  });
});
