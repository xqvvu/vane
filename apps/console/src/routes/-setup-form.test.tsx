// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SetupForm } from "#/routes/-setup-form.tsx";

const testState = vi.hoisted(() => ({
  navigate: vi.fn<() => Promise<void>>(async () => {}),
  authClient: {
    signUp: {
      email:
        vi.fn<
          (input: { name: string; email: string; password: string }) => Promise<{ error: null }>
        >(),
    },
  },
}));

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => testState.navigate,
}));

vi.mock("#/lib/auth.client.ts", () => ({
  authClient: testState.authClient,
}));

describe("setup form", () => {
  afterEach(() => {
    cleanup();
    testState.navigate.mockClear();
    testState.authClient.signUp.email.mockReset();
  });

  it("submits first setup through Better Auth sign-up and returns to the dashboard", async () => {
    const queryClient = new QueryClient();
    testState.authClient.signUp.email.mockResolvedValueOnce({ error: null });
    render(
      <QueryClientProvider client={queryClient}>
        <SetupForm redirectTo="/" />
      </QueryClientProvider>,
    );

    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Vane Owner" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "owner@example.test" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "correct horse battery staple" },
    });
    fireEvent.submit(screen.getByRole("button", { name: "Create owner" }).closest("form")!);

    await vi.waitFor(() => {
      expect(testState.authClient.signUp.email).toHaveBeenCalledWith({
        name: "Vane Owner",
        email: "owner@example.test",
        password: "correct horse battery staple",
      });
      expect(testState.navigate).toHaveBeenCalledWith({
        to: "/",
      });
    });
  });
});
