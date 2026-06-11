// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LoginForm } from "#/routes/-login-form.client.tsx";

const testState = vi.hoisted(() => ({
  navigate: vi.fn<() => Promise<void>>(async () => {}),
  authClient: {
    signIn: {
      email: vi.fn<(input: { email: string; password: string }) => Promise<{ error: null }>>(),
    },
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

describe("login form", () => {
  afterEach(() => {
    cleanup();
    testState.navigate.mockClear();
    testState.authClient.signIn.email.mockReset();
    testState.authClient.signUp.email.mockReset();
  });

  it("switches into first setup mode for owner registration", () => {
    render(<LoginForm redirectTo="/" />);

    fireEvent.click(screen.getByRole("button", { name: "First setup" }));

    expect((screen.getByLabelText("Name") as HTMLInputElement).value).toBe("Vane Owner");
    expect(screen.getByRole("button", { name: "Create owner" })).toBeTruthy();
  });

  it("submits first setup through Better Auth sign-up and returns to the dashboard", async () => {
    testState.authClient.signUp.email.mockResolvedValueOnce({ error: null });
    render(<LoginForm redirectTo="/" />);

    fireEvent.click(screen.getByRole("button", { name: "First setup" }));
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
