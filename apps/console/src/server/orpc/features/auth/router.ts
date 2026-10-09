import { findDashboardContext } from "#/server/orpc/middlewares/dashboard-context";
import { os } from "#/server/orpc/os";
import { getApplicationContainer } from "#/server/runtime/container";

/**
 * Public auth procedures.
 *
 * `getDashboardSession` stays tolerant: the dashboard shell asks for the session
 * before it knows whether one exists, so a missing session returns `null`
 * instead of an UNAUTHORIZED error the client would have to catch.
 */
export const authRouter = os.auth.router({
  getDashboardSession: os.auth.getDashboardSession.handler(async ({ context }) => {
    const dashboardRequest = await findDashboardContext({ reqHeaders: context.reqHeaders });

    if (!dashboardRequest) {
      return null;
    }

    return {
      user: {
        id: dashboardRequest.currentUser.id,
        name: dashboardRequest.currentUser.name ?? null,
        email: dashboardRequest.currentUser.email,
        image: dashboardRequest.currentUser.image ?? null,
        role: dashboardRequest.currentUser.role ?? null,
      },
    };
  }),

  getAuthBootstrap: os.auth.getAuthBootstrap.handler(async () => {
    return {
      setupRequired: !(await getApplicationContainer().hasRegisteredUsers()),
    };
  }),
});
