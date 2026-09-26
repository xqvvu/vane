import { ORPCError, os } from "@orpc/server";

import {
  DashboardAuthError,
  DashboardAuthorizationError,
} from "#/server/runtime/dashboard-session";
import {
  requireDashboardRequestContext,
  type DashboardRequestContext,
} from "#/server/runtime/request-context";

/**
 * Dashboard session guard for oRPC procedures.
 *
 * Attach this per procedure (`os.sources.list.use(requireDashboard())`) instead
 * of on the whole router: router-level middleware would force the UNAUTHORIZED /
 * FORBIDDEN error map onto every procedure, including the public auth and i18n
 * ones. Each procedure that needs it declares the matching keys on its contract.
 *
 * The middleware resolves the session from the RPC request headers, so it works
 * for both the browser transport and in-process server calls made through
 * `createRouterClient`.
 */
export function requireDashboard() {
  return os.middleware(async ({ context, next }) => {
    try {
      const dashboardRequest = await requireDashboardRequestContext({
        headers: context.reqHeaders,
      });

      return next({
        context: {
          dashboardRequest,
        },
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
  });
}

declare module "@orpc/server" {
  export interface DefaultInitialContext {
    dashboardRequest?: DashboardRequestContext;
  }
}
