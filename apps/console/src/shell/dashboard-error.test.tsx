// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { VaneIntlProvider } from "#/i18n/provider";
import { DashboardErrorPage } from "#/shell/dashboard-error";
import { DashboardNotFoundPage } from "#/shell/dashboard-not-found";

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

    render(
      <VaneIntlProvider locale="en-US">
        <DashboardErrorPage error={error} reset={reset} />
      </VaneIntlProvider>,
    );

    expect(screen.getByRole("heading", { name: "Application error" })).toBeTruthy();
    expect(
      screen.getByText("Internal rendering failure: sqlite failed token=[REDACTED]"),
    ).toBeTruthy();
    expect(screen.getByText("/routes?token=[REDACTED]")).toBeTruthy();
    expect(screen.queryByText("Operational checklist")).toBeNull();
    expect(screen.queryByText(/super-secret/)).toBeNull();
    expect(screen.queryByText(/route-token/)).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(reset).toHaveBeenCalledOnce();
    expect(routerState.invalidate).toHaveBeenCalledOnce();
  });
});

describe("dashboard not found page", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders a centered 404 page without the checklist column", () => {
    render(
      <VaneIntlProvider locale="en-US">
        <DashboardNotFoundPage />
      </VaneIntlProvider>,
    );

    expect(screen.getByRole("heading", { name: "Route not found" })).toBeTruthy();
    expect(screen.getByText("/routes?token=[REDACTED]")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Return to Sources" })).toBeTruthy();
    expect(screen.queryByText("Navigation check")).toBeNull();
    expect(screen.queryByText("Recommended recovery steps for operators.")).toBeNull();
    expect(screen.queryByText(/route-token/)).toBeNull();
  });
});
