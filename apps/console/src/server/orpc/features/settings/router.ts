import { withDashboardService } from "#/server/orpc/middlewares/require-dashboard";
import { os } from "#/server/orpc/os";

/** Console runtime settings. */
const withAppSettingsService = withDashboardService((container) =>
  container.createAppSettingsService(),
);

export const settingsRouter = os.settings.router({
  get: os.settings.get
    .use(withAppSettingsService)
    .handler(({ context }) => context.service.getAppSettings()),

  update: os.settings.update
    .use(withAppSettingsService)
    .handler(({ context, input }) => context.service.updateAppSettings(input)),
});
