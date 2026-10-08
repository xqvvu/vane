import { withDashboardService } from "#/server/orpc/middlewares/require-dashboard";
import { os } from "#/server/orpc/os";

/**
 * Portable configuration export/import.
 *
 * Handlers return the service DTOs unchanged: exports carry no secrets, and an
 * import returns the freshly minted Source tokens exactly once.
 */
const withConfigPortabilityService = withDashboardService((container) =>
  container.createConfigPortabilityService(),
);

export const portabilityRouter = os.portability.router({
  exportToml: os.portability.exportToml
    .use(withConfigPortabilityService)
    .handler(async ({ context, input }) => ({
      toml: await context.service.exportTomlFromCommand(input),
    })),

  exportJson: os.portability.exportJson
    .use(withConfigPortabilityService)
    .handler(async ({ context, input }) => ({
      json: await context.service.exportJsonFromCommand(input),
    })),

  importToml: os.portability.importToml
    .use(withConfigPortabilityService)
    .handler(({ context, input }) => context.service.importTomlFromCommand(input)),

  importJson: os.portability.importJson
    .use(withConfigPortabilityService)
    .handler(({ context, input }) => context.service.importJsonFromCommand(input)),
});
