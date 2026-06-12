// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DashboardErrorPage } from "#/shell/dashboard-error.tsx";

const routerState = vi.hoisted(() => ({
  invalidate: vi.fn<() => Promise<void>>(async () => {}),
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    children,
    className,
  }: {
    to: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
  useLocation: ({ select }: { select: (location: { href: string }) => string }) =>
    select({ href: "/routes?token=route-token" }),
  useRouter: () => routerState,
}));

describe("dashboard error page", () => {
  afterEach(() => {
    cleanup();
    routerState.invalidate.mockClear();
  });

  it("renders a redacted error summary and recovery controls", () => {
    const reset = vi.fn<() => void>();
    const error = new Error("sqlite failed token=super-secret");

    render(<DashboardErrorPage error={error} reset={reset} />);

    expect(screen.getByRole("heading", { name: "Application error" })).toBeTruthy();
    expect(screen.getByText("Internal rendering failure: Error")).toBeTruthy();
    expect(screen.queryByText(/super-secret/)).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(reset).toHaveBeenCalledOnce();
    expect(routerState.invalidate).toHaveBeenCalledOnce();
  });
});
