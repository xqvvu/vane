import { createServerFn } from "@tanstack/react-start";

import {
  CreateDestinationCommandSchema,
  CreateRouteCommandSchema,
  CreateSourceCommandSchema,
  DeleteDestinationCommandSchema,
  DeleteRouteCommandSchema,
  DeleteSourceCommandSchema,
  ExportConfigurationCommandSchema,
  GetDestinationTemplateDraftCommandSchema,
  ImportConfigurationCommandSchema,
  ImportConfigurationJsonCommandSchema,
  PreviewDestinationDraftCommandSchema,
  PreviewDestinationCommandSchema,
  PreviewDestinationUpdateCommandSchema,
  RotateSourceTokenCommandSchema,
  TestDestinationCommandSchema,
  UpdateAppSettingsCommandSchema,
  UpdateDestinationCommandSchema,
  UpdateRouteCommandSchema,
  UpdateSourceCommandSchema,
} from "@vane/core";

import { requireDashboardContextMiddleware } from "#/middlewares/dashboard-context.middleware";

/**
 * Dashboard configuration RPCs.
 *
 * Auth boundary: every export below uses `requireDashboardContextMiddleware`
 * (session cookie / Better Auth). Webhook intake must never call these; it uses
 * Source token auth on `routes/api/sources/$sourceId/webhook` instead.
 *
 * Contract boundary: command schemas and secret-safe result DTOs live in
 * `@vane/core`. Handlers only validate (via `.validator`), establish dashboard
 * context, call a capability service, and return the service DTO.
 */

export const listSourcesFn = createServerFn({ method: "GET" })
  .middleware([requireDashboardContextMiddleware])
  .handler(async ({ context }) =>
    (await context.dashboardRequest.container.createSourceService()).listSources(),
  );

export const listDestinationsFn = createServerFn({ method: "GET" })
  .middleware([requireDashboardContextMiddleware])
  .handler(async ({ context }) =>
    (await context.dashboardRequest.container.createDestinationService()).listDestinations(),
  );

export const listRoutesFn = createServerFn({ method: "GET" })
  .middleware([requireDashboardContextMiddleware])
  .handler(async ({ context }) =>
    (await context.dashboardRequest.container.createRouteService()).listRoutes(),
  );

export const getAppSettingsFn = createServerFn({ method: "GET" })
  .middleware([requireDashboardContextMiddleware])
  .handler(async ({ context }) =>
    (await context.dashboardRequest.container.createAppSettingsService()).getAppSettings(),
  );

export const listDestinationCatalogFn = createServerFn({ method: "GET" })
  .middleware([requireDashboardContextMiddleware])
  .handler(async ({ context }) =>
    (await context.dashboardRequest.container.createDestinationService()).listDestinationCatalog(),
  );

export const getDestinationTemplateDraftFn = createServerFn({ method: "GET" })
  .middleware([requireDashboardContextMiddleware])
  .validator(GetDestinationTemplateDraftCommandSchema)
  .handler(async ({ data, context }) =>
    (
      await context.dashboardRequest.container.createDestinationService()
    ).getDestinationTemplateDraft(data),
  );

export const exportConfigurationTomlFn = createServerFn({ method: "GET" })
  .middleware([requireDashboardContextMiddleware])
  .validator(ExportConfigurationCommandSchema)
  .handler(async ({ data, context }) => {
    return {
      toml: await (
        await context.dashboardRequest.container.createConfigPortabilityService()
      ).exportTomlFromCommand(data),
    };
  });

export const exportConfigurationJsonFn = createServerFn({ method: "GET" })
  .middleware([requireDashboardContextMiddleware])
  .validator(ExportConfigurationCommandSchema)
  .handler(async ({ data, context }) => {
    return {
      json: await (
        await context.dashboardRequest.container.createConfigPortabilityService()
      ).exportJsonFromCommand(data),
    };
  });

export const importConfigurationTomlFn = createServerFn({ method: "POST" })
  .middleware([requireDashboardContextMiddleware])
  .validator(ImportConfigurationCommandSchema)
  .handler(async ({ data, context }) =>
    (
      await context.dashboardRequest.container.createConfigPortabilityService()
    ).importTomlFromCommand(data),
  );

export const importConfigurationJsonFn = createServerFn({ method: "POST" })
  .middleware([requireDashboardContextMiddleware])
  .validator(ImportConfigurationJsonCommandSchema)
  .handler(async ({ data, context }) =>
    (
      await context.dashboardRequest.container.createConfigPortabilityService()
    ).importJsonFromCommand(data),
  );

export const createSourceFn = createServerFn({ method: "POST" })
  .middleware([requireDashboardContextMiddleware])
  .validator(CreateSourceCommandSchema)
  .handler(async ({ data, context }) =>
    (await context.dashboardRequest.container.createSourceService()).createSource(data),
  );

export const updateSourceFn = createServerFn({ method: "POST" })
  .middleware([requireDashboardContextMiddleware])
  .validator(UpdateSourceCommandSchema)
  .handler(async ({ data, context }) =>
    (await context.dashboardRequest.container.createSourceService()).updateSource(data),
  );

export const rotateSourceTokenFn = createServerFn({ method: "POST" })
  .middleware([requireDashboardContextMiddleware])
  .validator(RotateSourceTokenCommandSchema)
  .handler(async ({ data, context }) =>
    (await context.dashboardRequest.container.createSourceService()).rotateSourceToken(data),
  );

export const deleteSourceFn = createServerFn({ method: "POST" })
  .middleware([requireDashboardContextMiddleware])
  .validator(DeleteSourceCommandSchema)
  .handler(async ({ data, context }) =>
    (await context.dashboardRequest.container.createSourceService()).deleteSource(data),
  );

export const createDestinationFn = createServerFn({ method: "POST" })
  .middleware([requireDashboardContextMiddleware])
  .validator(CreateDestinationCommandSchema)
  .handler(async ({ data, context }) =>
    (await context.dashboardRequest.container.createDestinationService()).createDestination(data),
  );

export const updateDestinationFn = createServerFn({ method: "POST" })
  .middleware([requireDashboardContextMiddleware])
  .validator(UpdateDestinationCommandSchema)
  .handler(async ({ data, context }) =>
    (await context.dashboardRequest.container.createDestinationService()).updateDestination(data),
  );

export const deleteDestinationFn = createServerFn({ method: "POST" })
  .middleware([requireDashboardContextMiddleware])
  .validator(DeleteDestinationCommandSchema)
  .handler(async ({ data, context }) =>
    (await context.dashboardRequest.container.createDestinationService()).deleteDestination(data),
  );

export const testDestinationFn = createServerFn({ method: "POST" })
  .middleware([requireDashboardContextMiddleware])
  .validator(TestDestinationCommandSchema)
  .handler(async ({ data, context }) =>
    (await context.dashboardRequest.container.createDestinationService()).testDestination(data),
  );

export const previewDestinationFn = createServerFn({ method: "POST" })
  .middleware([requireDashboardContextMiddleware])
  .validator(PreviewDestinationCommandSchema)
  .handler(async ({ data, context }) =>
    (await context.dashboardRequest.container.createDestinationService()).previewDestination(data),
  );

export const previewDestinationDraftFn = createServerFn({ method: "POST" })
  .middleware([requireDashboardContextMiddleware])
  .validator(PreviewDestinationDraftCommandSchema)
  .handler(async ({ data, context }) =>
    (await context.dashboardRequest.container.createDestinationService()).previewDestinationDraft(
      data,
    ),
  );

export const previewDestinationUpdateFn = createServerFn({ method: "POST" })
  .middleware([requireDashboardContextMiddleware])
  .validator(PreviewDestinationUpdateCommandSchema)
  .handler(async ({ data, context }) =>
    (await context.dashboardRequest.container.createDestinationService()).previewDestinationUpdate(
      data,
    ),
  );

export const createRouteFn = createServerFn({ method: "POST" })
  .middleware([requireDashboardContextMiddleware])
  .validator(CreateRouteCommandSchema)
  .handler(async ({ data, context }) =>
    (await context.dashboardRequest.container.createRouteService()).createRoute(data),
  );

export const updateRouteFn = createServerFn({ method: "POST" })
  .middleware([requireDashboardContextMiddleware])
  .validator(UpdateRouteCommandSchema)
  .handler(async ({ data, context }) =>
    (await context.dashboardRequest.container.createRouteService()).updateRoute(data),
  );

export const deleteRouteFn = createServerFn({ method: "POST" })
  .middleware([requireDashboardContextMiddleware])
  .validator(DeleteRouteCommandSchema)
  .handler(async ({ data, context }) =>
    (await context.dashboardRequest.container.createRouteService()).deleteRoute(data),
  );

export const updateAppSettingsFn = createServerFn({ method: "POST" })
  .middleware([requireDashboardContextMiddleware])
  .validator(UpdateAppSettingsCommandSchema)
  .handler(async ({ data, context }) =>
    (await context.dashboardRequest.container.createAppSettingsService()).updateAppSettings(data),
  );
