import { oc } from "@orpc/contract";
import { openapi } from "@orpc/openapi";

import {
  CreateRouteCommandSchema,
  DeleteRouteCommandSchema,
  UpdateRouteCommandSchema,
} from "@vane/core";

import { dashboardAuth } from "../errors/dashboard-auth";
import { RouteDeleteOutputSchema, RouteListOutputSchema, RouteOutputSchema } from "../schemas/routes";

const dashboardErrors = dashboardAuth.error;

/** Route rule administration. */
export const routes = {
  list: oc.meta(openapi({ method: "GET" })).errors(dashboardErrors).output(RouteListOutputSchema),

  create: oc
    .meta(openapi({ method: "POST" }))
    .input(CreateRouteCommandSchema)
    .errors(dashboardErrors)
    .output(RouteOutputSchema),

  update: oc
    .meta(openapi({ method: "POST" }))
    .input(UpdateRouteCommandSchema)
    .errors(dashboardErrors)
    .output(RouteOutputSchema),

  delete: oc
    .meta(openapi({ method: "POST" }))
    .input(DeleteRouteCommandSchema)
    .errors(dashboardErrors)
    .output(RouteDeleteOutputSchema),
};
