// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SetupFormClient } from "#/routes/-setup-form-impl.tsx";
import { SetupForm } from "#/routes/-setup-form.tsx";

const testState = vi.hoisted(() => ({
  navigate: vi.fn<() => Promise<void>>(async () => {}),
  toast: {
    error: vi.fn<(title: string, options?: { description?: string }) => void>(),
    success: vi.fn<(title: string, options?: { description?: string }) => void>(),
  },
  authClient: {
    signUp: {
      email:
        vi.fn<
          (input: {
            name: string;
            email: string;
            password: string;
          }) => Promise<{ error: null | { message?: string } }>
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

vi.mock("sonner", () => ({
  toast: testState.toast,
}));

describe("setup form", () => {
  afterEach(() => {
    cleanup();
    testState.navigate.mockClear();
    testState.toast.error.mockClear();
    testState.toast.success.mockClear();
    testState.authClient.signUp.email.mockReset();
  });

  it("submits first setup through Better Auth sign-up and returns to the dashboard", async () => {
    const queryClient = new QueryClient();
    testState.authClient.signUp.email.mockResolvedValueOnce({ error: null });
    render(
      <QueryClientProvider client={queryClient}>
        <SetupFormClient redirectTo="/" />
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
      expect(testState.toast.success).toHaveBeenCalledWith("Owner account created", {
        description: "Opening the dashboard.",
      });
      expect(testState.navigate).toHaveBeenCalledWith({
        to: "/",
      });
    });
  });

  it("exposes a colocated skeleton", () => {
    const { container } = render(<SetupForm.Skeleton />);

    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
  });

  it("shows a toast when first setup fails", async () => {
    const queryClient = new QueryClient();
    testState.authClient.signUp.email.mockResolvedValueOnce({
      error: {
        message: "Email is already registered",
      },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <SetupFormClient redirectTo="/" />
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
      expect(testState.toast.error).toHaveBeenCalledWith("Setup failed", {
        description: "Email is already registered",
      });
      expect(testState.navigate).not.toHaveBeenCalled();
    });
  });
});
