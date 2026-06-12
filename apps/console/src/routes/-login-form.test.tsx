// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { authQueryKeys, dashboardSessionQueryOptions } from "#/features/auth/api/auth.queries.ts";
import { LoginForm } from "#/routes/-login-form.tsx";

const testState = vi.hoisted(() => ({
  navigate: vi.fn<() => Promise<void>>(async () => {}),
  authClient: {
    signIn: {
      email: vi.fn<(input: { email: string; password: string }) => Promise<{ error: null }>>(),
    },
  },
}));

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => testState.navigate,
}));

vi.mock("#/lib/auth.client.ts", () => ({
  authClient: testState.authClient,
}));

describe("login form", () => {
  afterEach(() => {
    cleanup();
    testState.navigate.mockClear();
    testState.authClient.signIn.email.mockReset();
  });

  it("renders a sign-in only form", () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <LoginForm redirectTo="/" />
      </QueryClientProvider>,
    );

    expect(screen.getByRole("button", { name: "Login" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Create owner" })).toBeNull();
    expect(screen.queryByText("First setup")).toBeNull();
    expect(screen.queryByText("Login with Google")).toBeNull();
    expect(screen.queryByText("Sign up")).toBeNull();
  });

  it("submits credentials through Better Auth sign-in and returns to the dashboard", async () => {
    const queryClient = new QueryClient();
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
    testState.authClient.signIn.email.mockResolvedValueOnce({ error: null });
    queryClient.setQueryData(dashboardSessionQueryOptions().queryKey, null);

    render(
      <QueryClientProvider client={queryClient}>
        <LoginForm redirectTo="/" />
      </QueryClientProvider>,
    );

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "owner@example.test" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "correct horse battery staple" },
    });
    fireEvent.submit(screen.getByRole("button", { name: "Login" }).closest("form")!);

    await vi.waitFor(() => {
      expect(testState.authClient.signIn.email).toHaveBeenCalledWith({
        email: "owner@example.test",
        password: "correct horse battery staple",
      });
      expect(queryClient.getQueryData(dashboardSessionQueryOptions().queryKey)).toBeUndefined();
      expect(invalidateQueries).toHaveBeenCalledWith({
        queryKey: authQueryKeys.all,
      });
      expect(testState.navigate).toHaveBeenCalledWith({
        to: "/",
        replace: true,
      });
    });
  });
});
