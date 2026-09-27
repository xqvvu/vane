import { oc } from "@orpc/contract";
import { openapi } from "@orpc/openapi";

import { AuthBootstrapOutputSchema, DashboardSessionOutputSchema } from "../schemas/auth";

/**
 * Public auth procedures.
 *
 * Both procedures are reachable without a dashboard session: the login and
 * setup routes need the bootstrap flag, and the dashboard shell tolerates a
 * missing session so it can redirect. A null session is an expected result, not
 * an error, so neither procedure declares auth error keys.
 */
export const auth = {
  getDashboardSession: oc.meta(openapi({ method: "GET" })).output(DashboardSessionOutputSchema),

  getAuthBootstrap: oc.meta(openapi({ method: "GET" })).output(AuthBootstrapOutputSchema),
};
