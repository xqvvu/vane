import "@tanstack/react-start/server-only";
import { getRequestHeaders } from "@tanstack/react-start/server";

export interface DashboardSession {
  session: {
    id: string;
    userId: string;
  };
  user: {
    id: string;
    email: string;
    role?: string | null;
  };
}

export type GetDashboardSession = (input: {
  headers: HeadersInit;
}) => Promise<DashboardSession | null>;

export class DashboardAuthError extends Error {
  constructor(message = "Dashboard authentication required") {
    super(message);
    this.name = new.target.name;
  }
}

export class DashboardAuthorizationError extends Error {
  constructor(message = "Dashboard owner or admin access required") {
    super(message);
    this.name = new.target.name;
  }
}

export async function requireDashboardSession() {
  const { requireDashboardRequestContext } =
    await import("#/application/runtime/request-context.ts");
  const context = await requireDashboardRequestContext({
    headers: getRequestHeaders(),
  });

  return context.dashboardSession;
}

export async function requireDashboardSessionForHeaders(
  headers: HeadersInit,
  getSession: GetDashboardSession = getBetterAuthSession,
): Promise<DashboardSession> {
  const { requireDashboardRequestContext } =
    await import("#/application/runtime/request-context.ts");
  const context = await requireDashboardRequestContext({
    headers,
    getSession,
  });

  return context.dashboardSession;
}

async function getBetterAuthSession(input: { headers: HeadersInit }) {
  const { getApplicationContainer } = await import("#/application/runtime/container.ts");

  return getApplicationContainer().getAuth().api.getSession(input);
}
