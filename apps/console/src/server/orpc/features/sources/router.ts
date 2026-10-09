import { withDashboardService } from "#/server/orpc/middlewares/require-dashboard";
import { os } from "#/server/orpc/os";

/** Alert source (告警源) administration. Every procedure needs a dashboard session. */
const withSourceService = withDashboardService((container) => container.createSourceService());

export const sourcesRouter = os.sources.router({
  list: os.sources.list
    .use(withSourceService)
    .handler(({ context }) => context.service.listSources()),

  create: os.sources.create
    .use(withSourceService)
    .handler(({ context, input }) => context.service.createSource(input)),

  update: os.sources.update
    .use(withSourceService)
    .handler(({ context, input }) => context.service.updateSource(input)),

  rotateToken: os.sources.rotateToken
    .use(withSourceService)
    .handler(({ context, input }) => context.service.rotateSourceToken(input)),

  delete: os.sources.delete
    .use(withSourceService)
    .handler(({ context, input }) => context.service.deleteSource(input)),
});
