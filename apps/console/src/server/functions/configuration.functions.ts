import { createServerFn } from "@tanstack/react-start";

import {
  CreateDestinationCommandSchema,
  CreateRouteCommandSchema,
  CreateSourceCommandSchema,
  ExportConfigurationCommandSchema,
  ImportConfigurationCommandSchema,
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

import { requireDashboardContextMiddleware } from "#/middlewares/dashboard-context.middleware.ts";

export const listConfigurationFn = createServerFn({ method: "GET" })
  .middleware([requireDashboardContextMiddleware])
  .handler(async ({ context }) =>
    (await context.dashboardRequest.container.createConfigPortabilityService()).listConfiguration(),
  );

export const listDestinationCatalogFn = createServerFn({ method: "GET" })
  .middleware([requireDashboardContextMiddleware])
  .handler(async ({ context }) =>
    (await context.dashboardRequest.container.createDestinationService()).listDestinationCatalog(),
  );

export const listProviderCatalogFn = createServerFn({ method: "GET" })
  .middleware([requireDashboardContextMiddleware])
  .handler(async ({ context }) =>
    (
      await context.dashboardRequest.container.createConfigPortabilityService()
    ).listProviderCatalog(),
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

export const importConfigurationTomlFn = createServerFn({ method: "POST" })
  .middleware([requireDashboardContextMiddleware])
  .validator(ImportConfigurationCommandSchema)
  .handler(async ({ data, context }) =>
    (
      await context.dashboardRequest.container.createConfigPortabilityService()
    ).importTomlFromCommand(data),
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

export const updateAppSettingsFn = createServerFn({ method: "POST" })
  .middleware([requireDashboardContextMiddleware])
  .validator(UpdateAppSettingsCommandSchema)
  .handler(async ({ data, context }) =>
    (await context.dashboardRequest.container.createAppSettingsService()).updateAppSettings(data),
  );
