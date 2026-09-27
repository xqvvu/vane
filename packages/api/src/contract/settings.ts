import { oc } from "@orpc/contract";
import { openapi } from "@orpc/openapi";
import { UpdateAppSettingsCommandSchema } from "@vane/core";

import { dashboardAuth } from "../errors/dashboard-auth";
import { AppSettingsOutputSchema } from "../schemas/settings";

const dashboardErrors = dashboardAuth.error;

/** Console runtime settings (locale, time zone, retention). */
export const settings = {
  get: oc
    .meta(openapi({ method: "GET" }))
    .errors(dashboardErrors)
    .output(AppSettingsOutputSchema),

  update: oc
    .meta(openapi({ method: "POST" }))
    .input(UpdateAppSettingsCommandSchema)
    .errors(dashboardErrors)
    .output(AppSettingsOutputSchema),
};
