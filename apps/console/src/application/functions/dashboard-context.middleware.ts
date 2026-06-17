import { createMiddleware } from "@tanstack/react-start";

export const requireDashboardContextMiddleware = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const { requireDashboardRequestContext } =
      await import("#/application/runtime/request-context.ts");
    const dashboardRequest = await requireDashboardRequestContext();

    return next({
      context: {
        dashboardRequest,
      },
    });
  },
);
