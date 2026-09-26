import { oc } from "@orpc/contract";
import { openapi } from "@orpc/openapi";

import {
  CreateSourceCommandSchema,
  DeleteSourceCommandSchema,
  RotateSourceTokenCommandSchema,
  UpdateSourceCommandSchema,
} from "@vane/core";

import { dashboardAuth } from "../errors/dashboard-auth";
import {
  SourceDeleteOutputSchema,
  SourceListOutputSchema,
  SourceOutputSchema,
  SourceTokenOutputSchema,
} from "../schemas/sources";

const dashboardErrors = dashboardAuth.error;

/**
 * Alert source (告警源) administration.
 *
 * Every procedure requires a dashboard session; webhook intake authenticates
 * with a Source token on `/api/sources/$sourceId/webhook` instead and never
 * reaches these procedures.
 */
export const sources = {
  list: oc
    .meta(openapi({ method: "GET" }))
    .errors(dashboardErrors)
    .output(SourceListOutputSchema),

  create: oc
    .meta(openapi({ method: "POST" }))
    .input(CreateSourceCommandSchema)
    .errors(dashboardErrors)
    .output(SourceTokenOutputSchema),

  update: oc
    .meta(openapi({ method: "POST" }))
    .input(UpdateSourceCommandSchema)
    .errors(dashboardErrors)
    .output(SourceOutputSchema),

  // Returns the new intake token exactly once; only its hash is persisted.
  rotateToken: oc
    .meta(openapi({ method: "POST" }))
    .input(RotateSourceTokenCommandSchema)
    .errors(dashboardErrors)
    .output(SourceTokenOutputSchema),

  delete: oc
    .meta(openapi({ method: "POST" }))
    .input(DeleteSourceCommandSchema)
    .errors(dashboardErrors)
    .output(SourceDeleteOutputSchema),
};
