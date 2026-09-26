import { requireDashboard } from "#/server/orpc/middlewares/require-dashboard";
import { os } from "#/server/orpc/os";

/**
 * Portable configuration export/import.
 *
 * Handlers return the service DTOs unchanged: exports carry no secrets, and an
 * import returns the freshly minted Source tokens exactly once.
 */
export const portabilityRouter = os.portability.router({
  exportToml: os.portability.exportToml
    .use(requireDashboard())
    .handler(async ({ context, input }) => ({
      toml: await (
        await context.dashboardRequest.container.createConfigPortabilityService()
      ).exportTomlFromCommand(input),
    })),

  exportJson: os.portability.exportJson
    .use(requireDashboard())
    .handler(async ({ context, input }) => ({
      json: await (
        await context.dashboardRequest.container.createConfigPortabilityService()
      ).exportJsonFromCommand(input),
    })),

  importToml: os.portability.importToml
    .use(requireDashboard())
    .handler(async ({ context, input }) =>
      (
        await context.dashboardRequest.container.createConfigPortabilityService()
      ).importTomlFromCommand(input),
    ),

  importJson: os.portability.importJson
    .use(requireDashboard())
    .handler(async ({ context, input }) =>
      (
        await context.dashboardRequest.container.createConfigPortabilityService()
      ).importJsonFromCommand(input),
    ),
});
