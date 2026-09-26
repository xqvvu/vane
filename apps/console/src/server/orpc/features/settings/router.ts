import { requireDashboard } from "#/server/orpc/middlewares/require-dashboard";
import { os } from "#/server/orpc/os";

/** Console runtime settings. */
export const settingsRouter = os.settings.router({
  get: os.settings.get
    .use(requireDashboard())
    .handler(async ({ context }) =>
      (await context.dashboardRequest!.container.createAppSettingsService()).getAppSettings(),
    ),

  update: os.settings.update
    .use(requireDashboard())
    .handler(async ({ context, input }) =>
      (await context.dashboardRequest!.container.createAppSettingsService()).updateAppSettings(
        input,
      ),
    ),
});
