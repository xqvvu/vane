import { ORPCError } from "@orpc/server";

import {
  DashboardAuthError,
  DashboardAuthorizationError,
} from "#/server/runtime/dashboard-session";
import {
  requireDashboardRequestContext,
  type DashboardRequestContext,
} from "#/server/runtime/request-context";

/**
 * Resolves the dashboard session for an oRPC procedure.
 *
 * This is the only place where console auth errors are translated into the
 * `UNAUTHORIZED` / `FORBIDDEN` codes that dashboard contracts declare, so the
 * guard middleware and the tolerant public probes share one implementation
 * instead of both restating the mapping.
 *
 * It reads the request headers from the oRPC context, which keeps the browser
 * transport and the in-process `createRouterClient` path on the same code path.
 */
export async function requireDashboardContext(input: {
  reqHeaders?: Headers;
}): Promise<DashboardRequestContext> {
  try {
    return await requireDashboardRequestContext({
      headers: input.reqHeaders,
    });
  } catch (error) {
    if (error instanceof DashboardAuthError) {
      throw new ORPCError("UNAUTHORIZED", {
        message: error.message,
        cause: error,
      });
    }

    if (error instanceof DashboardAuthorizationError) {
      throw new ORPCError("FORBIDDEN", {
        message: error.message,
        cause: error,
      });
    }

    throw error;
  }
}

/**
 * Tolerant variant used by public procedures such as the dashboard session
 * probe: a missing or insufficient session is an expected answer, not an error,
 * so only the auth errors are folded into `null` and unexpected failures still
 * propagate.
 */
export async function findDashboardContext(input: {
  reqHeaders?: Headers;
}): Promise<DashboardRequestContext | null> {
  try {
    return await requireDashboardContext(input);
  } catch (error) {
    if (error instanceof ORPCError) {
      return null;
    }

    throw error;
  }
}
