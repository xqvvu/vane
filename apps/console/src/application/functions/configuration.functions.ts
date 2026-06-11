import { createServerFn } from "@tanstack/react-start";

import { requireDashboardRequestContext } from "#/application/runtime/request-context.server.ts";
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
} from "#/application/services/configuration.ts";

export const listConfigurationFn = createServerFn({ method: "GET" }).handler(async () => {
  const context = await requireDashboardRequestContext();

  return context.container.createConfigurationService().listConfiguration();
});

export const exportConfigurationTomlFn = createServerFn({ method: "GET" })
  .validator(ExportConfigurationCommandSchema)
  .handler(async ({ data }) => {
    const context = await requireDashboardRequestContext();

    return {
      toml: context.container.createConfigurationService().exportTomlFromCommand(data),
    };
  });

export const importConfigurationTomlFn = createServerFn({ method: "POST" })
  .validator(ImportConfigurationCommandSchema)
  .handler(async ({ data }) => {
    const context = await requireDashboardRequestContext();

    return context.container.createConfigurationService().importTomlFromCommand(data);
  });

export const createSourceFn = createServerFn({ method: "POST" })
  .validator(CreateSourceCommandSchema)
  .handler(async ({ data }) => {
    const context = await requireDashboardRequestContext();

    return context.container.createConfigurationService().createSource(data);
  });

export const updateSourceFn = createServerFn({ method: "POST" })
  .validator(UpdateSourceCommandSchema)
  .handler(async ({ data }) => {
    const context = await requireDashboardRequestContext();

    return context.container.createConfigurationService().updateSource(data);
  });

export const rotateSourceTokenFn = createServerFn({ method: "POST" })
  .validator(RotateSourceTokenCommandSchema)
  .handler(async ({ data }) => {
    const context = await requireDashboardRequestContext();

    return context.container.createConfigurationService().rotateSourceToken(data);
  });

export const createDestinationFn = createServerFn({ method: "POST" })
  .validator(CreateDestinationCommandSchema)
  .handler(async ({ data }) => {
    const context = await requireDashboardRequestContext();

    return context.container.createConfigurationService().createDestination(data);
  });

export const updateDestinationFn = createServerFn({ method: "POST" })
  .validator(UpdateDestinationCommandSchema)
  .handler(async ({ data }) => {
    const context = await requireDashboardRequestContext();

    return context.container.createConfigurationService().updateDestination(data);
  });

export const testDestinationFn = createServerFn({ method: "POST" })
  .validator(TestDestinationCommandSchema)
  .handler(async ({ data }) => {
    const context = await requireDashboardRequestContext();

    return context.container.createConfigurationService().testDestination(data);
  });

export const previewDestinationFn = createServerFn({ method: "POST" })
  .validator(PreviewDestinationCommandSchema)
  .handler(async ({ data }) => {
    const context = await requireDashboardRequestContext();

    return context.container.createConfigurationService().previewDestination(data);
  });

export const previewDestinationDraftFn = createServerFn({ method: "POST" })
  .validator(PreviewDestinationDraftCommandSchema)
  .handler(async ({ data }) => {
    const context = await requireDashboardRequestContext();

    return context.container.createConfigurationService().previewDestinationDraft(data);
  });

export const previewDestinationUpdateFn = createServerFn({ method: "POST" })
  .validator(PreviewDestinationUpdateCommandSchema)
  .handler(async ({ data }) => {
    const context = await requireDashboardRequestContext();

    return context.container.createConfigurationService().previewDestinationUpdate(data);
  });

export const createRouteFn = createServerFn({ method: "POST" })
  .validator(CreateRouteCommandSchema)
  .handler(async ({ data }) => {
    const context = await requireDashboardRequestContext();

    return context.container.createConfigurationService().createRoute(data);
  });

export const updateRouteFn = createServerFn({ method: "POST" })
  .validator(UpdateRouteCommandSchema)
  .handler(async ({ data }) => {
    const context = await requireDashboardRequestContext();

    return context.container.createConfigurationService().updateRoute(data);
  });

export const updateAppSettingsFn = createServerFn({ method: "POST" })
  .validator(UpdateAppSettingsCommandSchema)
  .handler(async ({ data }) => {
    const context = await requireDashboardRequestContext();

    return context.container.createConfigurationService().updateAppSettings(data);
  });
