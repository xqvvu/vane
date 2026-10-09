import { withDashboardService } from "#/server/orpc/middlewares/require-dashboard";
import { os } from "#/server/orpc/os";

const withFeishuAppService = withDashboardService((container) =>
  container.createFeishuAppService(),
);

export const integrationsRouter = os.integrations.router({
  listFeishuApps: os.integrations.listFeishuApps
    .use(withFeishuAppService)
    .handler(({ context }) => context.service.listFeishuApps()),

  createFeishuApp: os.integrations.createFeishuApp
    .use(withFeishuAppService)
    .handler(({ context, input }) => context.service.createFeishuApp(input)),

  updateFeishuApp: os.integrations.updateFeishuApp
    .use(withFeishuAppService)
    .handler(({ context, input }) => context.service.updateFeishuApp(input)),

  deleteFeishuApp: os.integrations.deleteFeishuApp
    .use(withFeishuAppService)
    .handler(({ context, input }) => context.service.deleteFeishuApp(input)),

  testFeishuApp: os.integrations.testFeishuApp
    .use(withFeishuAppService)
    .handler(({ context, input }) => context.service.testFeishuApp(input)),
});
