import { describe, expect, it } from "vitest";

import { requireDashboardSessionForHeaders } from "#/server/runtime/dashboard-auth.ts";
import {
  DashboardAuthError,
  DashboardAuthorizationError,
  type DashboardSession,
} from "#/server/runtime/dashboard-session.ts";

const session: DashboardSession = {
  session: {
    id: "session-1",
    userId: "user-1",
  },
  user: {
    id: "user-1",
    email: "owner@example.test",
    role: "owner",
  },
};

describe("dashboard auth", () => {
  it("returns active owner sessions", async () => {
    await expect(
      requireDashboardSessionForHeaders(new Headers(), async () => session),
    ).resolves.toBe(session);
  });

  it("returns active admin sessions", async () => {
    const adminSession: DashboardSession = {
      ...session,
      user: {
        ...session.user,
        role: "admin",
      },
    };

    await expect(
      requireDashboardSessionForHeaders(new Headers(), async () => adminSession),
    ).resolves.toBe(adminSession);
  });

  it("rejects unauthenticated dashboard requests", async () => {
    await expect(
      requireDashboardSessionForHeaders(new Headers(), async () => null),
    ).rejects.toBeInstanceOf(DashboardAuthError);
  });

  it("rejects non-admin dashboard sessions", async () => {
    const memberSession: DashboardSession = {
      ...session,
      user: {
        ...session.user,
        role: "member",
      },
    };

    await expect(
      requireDashboardSessionForHeaders(new Headers(), async () => memberSession),
    ).rejects.toBeInstanceOf(DashboardAuthorizationError);
  });
});
