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
} from "#/application/contracts/configuration-commands.ts";
import { requireDashboardContextMiddleware } from "#/application/functions/dashboard-context.middleware.ts";

export const listConfigurationFn = createServerFn({ method: "GET" })
  .middleware([requireDashboardContextMiddleware])
  .handler(async ({ context }) =>
    context.dashboardRequest.container.createConfigurationService().listConfiguration(),
  );

export const listDestinationCatalogFn = createServerFn({ method: "GET" })
  .middleware([requireDashboardContextMiddleware])
  .handler(async ({ context }) =>
    context.dashboardRequest.container.createConfigurationService().listDestinationCatalog(),
  );

export const listProviderCatalogFn = createServerFn({ method: "GET" })
  .middleware([requireDashboardContextMiddleware])
  .handler(async ({ context }) =>
    context.dashboardRequest.container.createConfigurationService().listProviderCatalog(),
  );

export const exportConfigurationTomlFn = createServerFn({ method: "GET" })
  .middleware([requireDashboardContextMiddleware])
  .validator(ExportConfigurationCommandSchema)
  .handler(async ({ data, context }) => {
    return {
      toml: context.dashboardRequest.container
        .createConfigurationService()
        .exportTomlFromCommand(data),
    };
  });

export const importConfigurationTomlFn = createServerFn({ method: "POST" })
  .middleware([requireDashboardContextMiddleware])
  .validator(ImportConfigurationCommandSchema)
  .handler(async ({ data, context }) =>
    context.dashboardRequest.container.createConfigurationService().importTomlFromCommand(data),
  );

export const createSourceFn = createServerFn({ method: "POST" })
  .middleware([requireDashboardContextMiddleware])
  .validator(CreateSourceCommandSchema)
  .handler(async ({ data, context }) =>
    context.dashboardRequest.container.createConfigurationService().createSource(data),
  );

export const updateSourceFn = createServerFn({ method: "POST" })
  .middleware([requireDashboardContextMiddleware])
  .validator(UpdateSourceCommandSchema)
  .handler(async ({ data, context }) =>
    context.dashboardRequest.container.createConfigurationService().updateSource(data),
  );

export const rotateSourceTokenFn = createServerFn({ method: "POST" })
  .middleware([requireDashboardContextMiddleware])
  .validator(RotateSourceTokenCommandSchema)
  .handler(async ({ data, context }) =>
    context.dashboardRequest.container.createConfigurationService().rotateSourceToken(data),
  );

export const createDestinationFn = createServerFn({ method: "POST" })
  .middleware([requireDashboardContextMiddleware])
  .validator(CreateDestinationCommandSchema)
  .handler(async ({ data, context }) =>
    context.dashboardRequest.container.createConfigurationService().createDestination(data),
  );

export const updateDestinationFn = createServerFn({ method: "POST" })
  .middleware([requireDashboardContextMiddleware])
  .validator(UpdateDestinationCommandSchema)
  .handler(async ({ data, context }) =>
    context.dashboardRequest.container.createConfigurationService().updateDestination(data),
  );

export const testDestinationFn = createServerFn({ method: "POST" })
  .middleware([requireDashboardContextMiddleware])
  .validator(TestDestinationCommandSchema)
  .handler(async ({ data, context }) =>
    context.dashboardRequest.container.createConfigurationService().testDestination(data),
  );

export const previewDestinationFn = createServerFn({ method: "POST" })
  .middleware([requireDashboardContextMiddleware])
  .validator(PreviewDestinationCommandSchema)
  .handler(async ({ data, context }) =>
    context.dashboardRequest.container.createConfigurationService().previewDestination(data),
  );

export const previewDestinationDraftFn = createServerFn({ method: "POST" })
  .middleware([requireDashboardContextMiddleware])
  .validator(PreviewDestinationDraftCommandSchema)
  .handler(async ({ data, context }) =>
    context.dashboardRequest.container.createConfigurationService().previewDestinationDraft(data),
  );

export const previewDestinationUpdateFn = createServerFn({ method: "POST" })
  .middleware([requireDashboardContextMiddleware])
  .validator(PreviewDestinationUpdateCommandSchema)
  .handler(async ({ data, context }) =>
    context.dashboardRequest.container.createConfigurationService().previewDestinationUpdate(data),
  );

export const createRouteFn = createServerFn({ method: "POST" })
  .middleware([requireDashboardContextMiddleware])
  .validator(CreateRouteCommandSchema)
  .handler(async ({ data, context }) =>
    context.dashboardRequest.container.createConfigurationService().createRoute(data),
  );

export const updateRouteFn = createServerFn({ method: "POST" })
  .middleware([requireDashboardContextMiddleware])
  .validator(UpdateRouteCommandSchema)
  .handler(async ({ data, context }) =>
    context.dashboardRequest.container.createConfigurationService().updateRoute(data),
  );

export const updateAppSettingsFn = createServerFn({ method: "POST" })
  .middleware([requireDashboardContextMiddleware])
  .validator(UpdateAppSettingsCommandSchema)
  .handler(async ({ data, context }) =>
    context.dashboardRequest.container.createConfigurationService().updateAppSettings(data),
  );
