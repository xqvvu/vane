import { createMiddleware } from "@tanstack/react-start";

import { requireDashboardRequestContext } from "#/server/runtime/request-context.ts";

export const requireDashboardContextMiddleware = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const dashboardRequest = await requireDashboardRequestContext();

    return next({
      context: {
        dashboardRequest,
      },
    });
  },
);
