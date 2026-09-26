import { requireDashboard } from "#/server/orpc/middlewares/require-dashboard";
import { os } from "#/server/orpc/os";

/** Route rule administration. */
export const routesRouter = os.routes.router({
  list: os.routes.list
    .use(requireDashboard())
    .handler(async ({ context }) =>
      (await context.dashboardRequest!.container.createRouteService()).listRoutes(),
    ),

  create: os.routes.create
    .use(requireDashboard())
    .handler(async ({ context, input }) =>
      (await context.dashboardRequest!.container.createRouteService()).createRoute(input),
    ),

  update: os.routes.update
    .use(requireDashboard())
    .handler(async ({ context, input }) =>
      (await context.dashboardRequest!.container.createRouteService()).updateRoute(input),
    ),

  delete: os.routes.delete
    .use(requireDashboard())
    .handler(async ({ context, input }) =>
      (await context.dashboardRequest!.container.createRouteService()).deleteRoute(input),
    ),
});
