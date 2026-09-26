import { requireDashboard } from "#/server/orpc/middlewares/require-dashboard";
import { os } from "#/server/orpc/os";

/** Alert source (告警源) administration. Every procedure needs a dashboard session. */
export const sourcesRouter = os.sources.router({
  list: os.sources.list
    .use(requireDashboard())
    .handler(async ({ context }) =>
      (await context.dashboardRequest!.container.createSourceService()).listSources(),
    ),

  create: os.sources.create
    .use(requireDashboard())
    .handler(async ({ context, input }) =>
      (await context.dashboardRequest!.container.createSourceService()).createSource(input),
    ),

  update: os.sources.update
    .use(requireDashboard())
    .handler(async ({ context, input }) =>
      (await context.dashboardRequest!.container.createSourceService()).updateSource(input),
    ),

  rotateToken: os.sources.rotateToken
    .use(requireDashboard())
    .handler(async ({ context, input }) =>
      (await context.dashboardRequest!.container.createSourceService()).rotateSourceToken(input),
    ),

  delete: os.sources.delete
    .use(requireDashboard())
    .handler(async ({ context, input }) =>
      (await context.dashboardRequest!.container.createSourceService()).deleteSource(input),
    ),
});
