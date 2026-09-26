import { os } from "#/server/orpc/os";
import { getApplicationContainer } from "#/server/runtime/container";
import { requireDashboardRequestContext } from "#/server/runtime/request-context";

/**
 * Public auth procedures.
 *
 * `getDashboardSession` stays tolerant: the dashboard shell asks for the session
 * before it knows whether one exists, so a missing session returns `null`
 * instead of an UNAUTHORIZED error the client would have to catch.
 */
export const authRouter = os.auth.router({
  getDashboardSession: os.auth.getDashboardSession.handler(async ({ context }) => {
    try {
      const dashboardRequest = await requireDashboardRequestContext({
        headers: context.reqHeaders,
      });

      return {
        user: {
          id: dashboardRequest.currentUser.id,
          name: dashboardRequest.currentUser.name ?? null,
          email: dashboardRequest.currentUser.email,
          image: dashboardRequest.currentUser.image ?? null,
          role: dashboardRequest.currentUser.role ?? null,
        },
      };
    } catch {
      return null;
    }
  }),

  getAuthBootstrap: os.auth.getAuthBootstrap.handler(async () => {
    return {
      setupRequired: !(await getApplicationContainer().hasRegisteredUsers()),
    };
  }),
});
