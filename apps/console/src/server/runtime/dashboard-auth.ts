import { getRequestHeaders } from "@tanstack/react-start/server";

import { getApplicationContainer } from "#/server/runtime/container.ts";
import type { DashboardSession, GetDashboardSession } from "#/server/runtime/dashboard-session.ts";
import { requireDashboardRequestContext } from "#/server/runtime/request-context.ts";

export type { DashboardSession, GetDashboardSession } from "#/server/runtime/dashboard-session.ts";
export {
  DashboardAuthError,
  DashboardAuthorizationError,
} from "#/server/runtime/dashboard-session.ts";

export async function requireDashboardSession() {
  const context = await requireDashboardRequestContext({
    headers: getRequestHeaders(),
  });

  return context.dashboardSession;
}

export async function requireDashboardSessionForHeaders(
  headers: HeadersInit,
  getSession: GetDashboardSession = getBetterAuthSession,
): Promise<DashboardSession> {
  const context = await requireDashboardRequestContext({
    headers,
    getSession,
  });

  return context.dashboardSession;
}

async function getBetterAuthSession(input: { headers: HeadersInit }) {
  return getApplicationContainer().getAuth().api.getSession(input);
}
