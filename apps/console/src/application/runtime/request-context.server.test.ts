import { createDefaultDestinationRegistry } from "@vane/destinations";
import { createDefaultProviderRegistry } from "@vane/providers";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ApplicationContainer, VaneAuth } from "#/application/runtime/container.server.ts";
import {
  DashboardAuthError,
  DashboardAuthorizationError,
  type DashboardSession,
} from "#/application/runtime/dashboard-auth.ts";
import {
  createWebhookRequestContext,
  requireDashboardRequestContext,
} from "#/application/runtime/request-context.server.ts";

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

const fakeGetSession = vi.fn<(input: { headers: HeadersInit }) => Promise<DashboardSession | null>>(
  async () => null,
);

const fakeAuth: VaneAuth = {
  handler: async () => new Response(null),
  api: {
    getSession: fakeGetSession,
  },
};

describe("request context", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("builds dashboard context from an authenticated owner session", async () => {
    const getSession = vi.fn<() => Promise<DashboardSession>>(async () => session);
    const container = createFakeContainer();

    const context = await requireDashboardRequestContext({
      container,
      headers: {
        cookie: "better-auth.session_token=token",
        "x-request-id": "request-1",
      },
      now: () => "2026-06-10T08:00:00.000Z",
      getSession,
    });

    expect(context.container).toBe(container);
    expect(context.currentUser).toEqual(session.user);
    expect(context.dashboardSession).toBe(session);
    expect(context.requestId).toBe("request-1");
    expect(context.now).toBe("2026-06-10T08:00:00.000Z");
    expect(getSession).toHaveBeenCalledWith({
      headers: expect.any(Headers),
    });
  });

  it("rejects missing or non-admin dashboard sessions", async () => {
    await expect(
      requireDashboardRequestContext({
        container: createFakeContainer(),
        headers: new Headers(),
        getSession: async () => null,
      }),
    ).rejects.toBeInstanceOf(DashboardAuthError);

    await expect(
      requireDashboardRequestContext({
        container: createFakeContainer(),
        headers: new Headers(),
        getSession: async () => ({
          ...session,
          user: {
            ...session.user,
            role: "member",
          },
        }),
      }),
    ).rejects.toBeInstanceOf(DashboardAuthorizationError);
  });

  it("builds webhook context without reading dashboard sessions", () => {
    const container = createFakeContainer();

    const context = createWebhookRequestContext({
      container,
      request: new Request("https://vane.test/api/sources/source-1/webhook", {
        method: "POST",
        headers: {
          authorization: "Bearer source-token",
          "x-vane-provider-secret": "provider-secret",
          "x-correlation-id": "correlation-1",
        },
      }),
      now: () => "2026-06-10T08:00:00.000Z",
    });

    expect(context.sourceToken).toBe("source-token");
    expect(context.hasProviderSecret).toBe(true);
    expect(context.requestId).toBe("correlation-1");
    expect(context.headersRecord).toMatchObject({
      authorization: "Bearer source-token",
      "x-vane-provider-secret": "provider-secret",
    });
    expect(fakeGetSession).not.toHaveBeenCalled();
  });
});

function createFakeContainer(): ApplicationContainer {
  return {
    getSqliteStore: () => {
      throw new Error("SQLite store is not used by request context tests");
    },
    getProviderRegistry: () => createDefaultProviderRegistry(),
    getDestinationRegistry: () => createDefaultDestinationRegistry(),
    createConfigurationService: () => {
      throw new Error("Configuration service is not used by request context tests");
    },
    createWebhookIntakeService: () => {
      throw new Error("Webhook intake service is not used by request context tests");
    },
    createDeliveryWorker: () => {
      throw new Error("Delivery worker is not used by request context tests");
    },
    ensureDeliveryWorkerRunner: () => ({
      runNow: async () => null,
      stop: () => {},
    }),
    getBetterAuthDatabase: () => {
      throw new Error("Auth database is not used by request context tests");
    },
    getAuth: () => fakeAuth,
  } satisfies ApplicationContainer;
}
