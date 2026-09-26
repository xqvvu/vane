import { requireDashboard } from "#/server/orpc/middlewares/require-dashboard";
import { os } from "#/server/orpc/os";

/**
 * Outbound destination administration.
 *
 * These handlers stay thin on purpose: they resolve the capability service from
 * the request-scoped container and return its DTO. Config validation, template
 * rendering, and secret handling belong to the service.
 */
export const destinationsRouter = os.destinations.router({
  list: os.destinations.list
    .use(requireDashboard())
    .handler(async ({ context }) =>
      (await context.dashboardRequest!.container.createDestinationService()).listDestinations(),
    ),

  listCatalog: os.destinations.listCatalog
    .use(requireDashboard())
    .handler(async ({ context }) =>
      (
        await context.dashboardRequest!.container.createDestinationService()
      ).listDestinationCatalog(),
    ),

  getTemplateDraft: os.destinations.getTemplateDraft
    .use(requireDashboard())
    .handler(async ({ context, input }) =>
      (
        await context.dashboardRequest!.container.createDestinationService()
      ).getDestinationTemplateDraft(input),
    ),

  create: os.destinations.create
    .use(requireDashboard())
    .handler(async ({ context, input }) =>
      (await context.dashboardRequest!.container.createDestinationService()).createDestination(
        input,
      ),
    ),

  update: os.destinations.update
    .use(requireDashboard())
    .handler(async ({ context, input }) =>
      (await context.dashboardRequest!.container.createDestinationService()).updateDestination(
        input,
      ),
    ),

  delete: os.destinations.delete
    .use(requireDashboard())
    .handler(async ({ context, input }) =>
      (await context.dashboardRequest!.container.createDestinationService()).deleteDestination(
        input,
      ),
    ),

  test: os.destinations.test
    .use(requireDashboard())
    .handler(async ({ context, input }) =>
      (await context.dashboardRequest!.container.createDestinationService()).testDestination(input),
    ),

  preview: os.destinations.preview
    .use(requireDashboard())
    .handler(async ({ context, input }) =>
      (await context.dashboardRequest!.container.createDestinationService()).previewDestination(
        input,
      ),
    ),

  previewDraft: os.destinations.previewDraft
    .use(requireDashboard())
    .handler(async ({ context, input }) =>
      (
        await context.dashboardRequest!.container.createDestinationService()
      ).previewDestinationDraft(input),
    ),

  previewUpdate: os.destinations.previewUpdate
    .use(requireDashboard())
    .handler(async ({ context, input }) =>
      (
        await context.dashboardRequest!.container.createDestinationService()
      ).previewDestinationUpdate(input),
    ),
});
