import { oc } from "@orpc/contract";
import { openapi } from "@orpc/openapi";
import {
  ExportConfigurationCommandSchema,
  ImportConfigurationCommandSchema,
  ImportConfigurationJsonCommandSchema,
} from "@vane/core";

import { dashboardAuth } from "../errors/dashboard-auth";
import {
  ConfigurationJsonOutputSchema,
  ConfigurationTomlOutputSchema,
  ImportConfigurationOutputSchema,
} from "../schemas/portability";

const dashboardErrors = dashboardAuth.error;

/**
 * Portable configuration export/import.
 *
 * Exports never contain Source tokens, signing secrets, or passwords. Imports
 * mint fresh Source tokens and return them once so the operator can rewire the
 * upstream systems.
 */
export const portability = {
  exportToml: oc
    .meta(openapi({ method: "GET" }))
    .input(ExportConfigurationCommandSchema)
    .errors(dashboardErrors)
    .output(ConfigurationTomlOutputSchema),

  exportJson: oc
    .meta(openapi({ method: "GET" }))
    .input(ExportConfigurationCommandSchema)
    .errors(dashboardErrors)
    .output(ConfigurationJsonOutputSchema),

  importToml: oc
    .meta(openapi({ method: "POST" }))
    .input(ImportConfigurationCommandSchema)
    .errors(dashboardErrors)
    .output(ImportConfigurationOutputSchema),

  importJson: oc
    .meta(openapi({ method: "POST" }))
    .input(ImportConfigurationJsonCommandSchema)
    .errors(dashboardErrors)
    .output(ImportConfigurationOutputSchema),
};
